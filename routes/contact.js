const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { rateLimit } = require('express-rate-limit');


// =====================================================
// ANTI-SPAM : maximum 5 messages par IP / 15 minutes
// =====================================================

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Trop de messages envoyés. Veuillez réessayer plus tard.'
});


// =====================================================
// ÉCHAPPER LE HTML
// =====================================================

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// =====================================================
// FORMULAIRE CONTACT
// =====================================================

router.post('/', contactLimiter, async (req, res) => {

    try {

        const {
            name,
            email,
            subject,
            message,
            website
        } = req.body;


        // =================================================
        // HONEYPOT
        // =================================================

        // Un vrai visiteur ne voit pas ce champ.
        // Les bots peuvent souvent le remplir.

        if (website) {

            console.log(
                'Spam bloqué par honeypot'
            );

            return res.redirect(
                '/contact?success=Votre message a été envoyé avec succès.'
            );
        }


        // =================================================
        // VALIDATION
        // =================================================

        if (!name || !email || !subject || !message) {

            return res.redirect(
                '/contact?error=Veuillez remplir tous les champs.'
            );

        }


        // =================================================
        // LIMITES
        // =================================================

        if (name.length > 100) {

            return res.redirect(
                '/contact?error=Le nom est trop long.'
            );

        }


        if (email.length > 150) {

            return res.redirect(
                '/contact?error=Le courriel est trop long.'
            );

        }


        if (subject.length > 200) {

            return res.redirect(
                '/contact?error=Le sujet est trop long.'
            );

        }


        if (message.length > 5000) {

            return res.redirect(
                '/contact?error=Le message est trop long.'
            );

        }


        // =================================================
        // VALIDATION COURRIEL
        // =================================================

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {

            return res.redirect(
                '/contact?error=Veuillez entrer une adresse courriel valide.'
            );

        }


        // =================================================
        // SMTP
        // =================================================

        const transporter = nodemailer.createTransport({

            host: 'smtp.mailersend.net',

            port: 2525,

            secure: false,

            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }

        });


        // =================================================
        // PROTECTION HTML
        // =================================================

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message);


        // =================================================
        // ENVOI
        // =================================================

        await transporter.sendMail({

            from: `"Site Vallée du Parc" <${process.env.MAIL_FROM}>`,

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

                <p>
                    <strong>Message :</strong>
                </p>

                <p>
                    ${safeMessage.replace(/\n/g, '<br>')}
                </p>
            `

        });


        console.log(
            `Message de contact reçu de : ${email}`
        );


        return res.redirect(
            '/contact?success=Votre message a été envoyé avec succès.'
        );


    } catch (error) {

        console.error(
            'Erreur formulaire contact :',
            error
        );


        return res.redirect(
            '/contact?error=Une erreur est survenue lors de l’envoi du message.'
        );

    }

});


module.exports = router;