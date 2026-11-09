const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const { sendMail } = require('../utils/mailer');

/* =========================
   ANTI-SPAM
   3 messages / IP / 15 minutes
========================= */

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Trop de messages envoyés. Veuillez réessayer plus tard.'
});

/* =========================
   OUTILS
========================= */

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function cleanValue(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function redirectError(res, message) {
    return res.redirect(
        `/contact?error=${encodeURIComponent(message)}`
    );
}

/* =========================
   FORMULAIRE CONTACT
========================= */

router.post('/', contactLimiter, async (req, res) => {
    try {
        const body = req.body || {};

        const name = cleanValue(body.name);
        const email = cleanValue(body.email).toLowerCase();
        const subject = cleanValue(body.subject);
        const message = cleanValue(body.message);
        const website = cleanValue(body.website);

        /* =========================
           HONEYPOT
        ========================= */

        // Un visiteur normal ne voit pas ce champ.
        // Si un robot le remplit, on simule une réussite.

        if (website) {
            console.log('Spam bloqué par le honeypot.');

            return res.redirect(
                '/contact?success=Votre%20message%20a%20été%20envoyé%20avec%20succès.'
            );
        }

        /* =========================
           VALIDATION DES TYPES
        ========================= */

        if (
            typeof body.name !== 'string' ||
            typeof body.email !== 'string' ||
            typeof body.subject !== 'string' ||
            typeof body.message !== 'string'
        ) {
            return redirectError(
                res,
                'Veuillez remplir tous les champs.'
            );
        }

        /* =========================
           CHAMPS OBLIGATOIRES
        ========================= */

        if (!name || !email || !subject || !message) {
            return redirectError(
                res,
                'Veuillez remplir tous les champs.'
            );
        }

        /* =========================
           LIMITES DE LONGUEUR
        ========================= */

        if (name.length > 100) {
            return redirectError(res, 'Le nom est trop long.');
        }

        if (email.length > 254) {
            return redirectError(res, 'Le courriel est trop long.');
        }

        if (subject.length > 200) {
            return redirectError(res, 'Le sujet est trop long.');
        }

        if (message.length > 5000) {
            return redirectError(res, 'Le message est trop long.');
        }

        /* =========================
           VALIDATION COURRIEL
        ========================= */

        if (!isValidEmail(email)) {
            return redirectError(
                res,
                'Veuillez entrer une adresse courriel valide.'
            );
        }

        /* =========================
           DÉTECTION DE SPAM
        ========================= */

        const contenu = `${name}\n${subject}\n${message}`;

        const spamPatterns = [
            /bit\.ly/i,
            /tinyurl\.com/i,
            /t\.co\//i,
            /goo\.gl/i,
            /ow\.ly/i,
            /is\.gd/i,
            /buff\.ly/i,

            /telegram/i,
            /whatsapp/i,
            /crypto/i,
            /casino/i,
            /viagra/i,
            /cool\s*hacker/i,

            /<\s*script/i,
            /<\s*a[\s>]/i,
            /<\s*b[\s>]/i,
            /<\s*iframe/i
        ];

        const isSpam = spamPatterns.some(pattern =>
            pattern.test(contenu)
        );

        const urlMatches = contenu.match(
            /https?:\/\/[^\s<>"']+/gi
        ) || [];

        const tooManyLinks = urlMatches.length >= 3;

        if (isSpam || tooManyLinks) {
            console.log('Message de spam bloqué.');

            // Réponse volontairement identique à une réussite.
            return res.redirect('/contact?success=1');
        }

        /* =========================
           VALIDATION DESTINATAIRE
        ========================= */

        if (!process.env.CONTACT_EMAIL) {
            throw new Error('Variable CONTACT_EMAIL manquante.');
        }

        /* =========================
           PROTECTION HTML
        ========================= */

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message)
            .replace(/\r\n|\r|\n/g, '<br>');

        /* =========================
           ENVOI DU COURRIEL
        ========================= */

        await sendMail({
            to: process.env.CONTACT_EMAIL,

            replyTo: email,

            subject: `Contact - ${subject}`,

            text: `
Nouveau message provenant du site web.

Nom :
${name}

Courriel :
${email}

Sujet :
${subject}

Message :
${message}
            `,

            html: `
                <h2>Nouveau message provenant du site web</h2>

                <p>
                    <strong>Nom :</strong>
                    ${safeName}
                </p>

                <p>
                    <strong>Courriel :</strong>
                    ${safeEmail}
                </p>

                <p>
                    <strong>Sujet :</strong>
                    ${safeSubject}
                </p>

                <hr>

                <p><strong>Message :</strong></p>

                <p>${safeMessage}</p>
            `
        });

        console.log('Un message du formulaire de contact a été envoyé.');

        return res.redirect(
            '/contact?success=Votre%20message%20a%20été%20envoyé%20avec%20succès.'
        );

    } catch (error) {
        console.error(
            'Erreur formulaire contact - code :',
            error.code || 'N/A',
            '- réponse :',
            error.responseCode || 'N/A',
            '- message :',
            error.message
        );

        return redirectError(
            res,
            'Une erreur est survenue lors de l’envoi du message.'
        );
    }
});

module.exports = router;