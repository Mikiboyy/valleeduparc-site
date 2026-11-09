const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

/* =========================
   CONFIGURATION SMTP
========================= */

const transporter = nodemailer.createTransport({
    host: 'smtp.mailersend.net',
    port: 2525,
    secure: false,
    requireTLS: true,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000
});

/* =========================
   FONCTIONS UTILITAIRES
========================= */

function cleanValue(value, maxLength = 2000) {
    if (typeof value !== 'string') return '';

    return value.trim().slice(0, maxLength);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSmtpErrorDetails(error) {
    return {
        code: error.code || 'N/A',
        responseCode: error.responseCode || 'N/A',
        message: error.message || 'Erreur inconnue'
    };
}

/* =========================
   ENVOI FORMULAIRE SALLE
========================= */

router.post('/', async (req, res) => {
    let emailStage = 'validation';

    try {
        const body = req.body || {};

        const client = cleanValue(body.client, 200);
        const adresse = cleanValue(body.adresse, 300);
        const ville = cleanValue(body.ville, 150);
        const codePostal = cleanValue(body.codePostal, 20);
        const telephone = cleanValue(body.telephone, 50);
        const courriel = cleanValue(body.courriel, 254).toLowerCase();
        const dateEvenement = cleanValue(body.dateEvenement, 50);
        const heureArrivee = cleanValue(body.heureArrivee, 50);
        const nombreBar = cleanValue(body.nombreBar, 50);
        const message = cleanValue(body.message, 3000);

        /* =========================
           VALIDATION
        ========================= */

        if (!client || !telephone || !courriel || !dateEvenement) {
            throw new Error('Informations obligatoires manquantes');
        }

        if (!isValidEmail(courriel)) {
            throw new Error('Adresse courriel invalide');
        }

        if (
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASS ||
            !process.env.FORM_RECEIVER_SALLE
        ) {
            throw new Error('Configuration SMTP ou destinataire manquant');
        }

        /* =========================
           PRÉPARATION HTML SÉCURISÉE
        ========================= */

        const safe = {
            client: escapeHtml(client),
            adresse: escapeHtml(adresse || 'Non précisée'),
            ville: escapeHtml(ville || 'Non précisée'),
            codePostal: escapeHtml(codePostal || 'Non précisé'),
            telephone: escapeHtml(telephone),
            courriel: escapeHtml(courriel),
            dateEvenement: escapeHtml(dateEvenement),
            heureArrivee: escapeHtml(heureArrivee || 'Non précisée'),
            nombreBar: escapeHtml(nombreBar || 'Non précisé'),
            message: escapeHtml(message || 'Aucun message supplémentaire')
                .replace(/\n/g, '<br>')
        };

        /* =========================
           COURRIEL À VALLÉE DU PARC
        ========================= */

        emailStage = 'notification_station';

        await transporter.sendMail({
            from: `"Site Vallée du Parc" <${process.env.SMTP_USER}>`,
            to: process.env.FORM_RECEIVER_SALLE,
            replyTo: courriel,
            subject: `Nouvelle demande de réservation de salle - ${client}`,

            html: `
                <h2>Nouvelle demande de réservation de salle</h2>
                <hr>

                <h3>Renseignements du client</h3>

                <p><strong>Client / organisation :</strong> ${safe.client}</p>
                <p><strong>Adresse :</strong> ${safe.adresse}</p>
                <p><strong>Ville :</strong> ${safe.ville}</p>
                <p><strong>Code postal :</strong> ${safe.codePostal}</p>
                <p><strong>Téléphone :</strong> ${safe.telephone}</p>
                <p><strong>Courriel :</strong> ${safe.courriel}</p>

                <hr>

                <h3>Informations sur l'événement</h3>

                <p><strong>Date de l'événement :</strong> ${safe.dateEvenement}</p>
                <p><strong>Heure d'arrivée :</strong> ${safe.heureArrivee}</p>
                <p><strong>Nombre de personnes :</strong> ${safe.nombreBar}</p>

                <hr>

                <h3>Informations supplémentaires</h3>
                <p>${safe.message}</p>
            `
        });

        /* =========================
           CONFIRMATION AU CLIENT
        ========================= */

        emailStage = 'confirmation_client';

        await transporter.sendMail({
            from: `"Vallée du Parc" <${process.env.SMTP_USER}>`,
            to: courriel,
            subject: 'Confirmation de votre demande de réservation',

            html: `
                <h2>Bonjour ${safe.client},</h2>

                <p>
                    Nous avons bien reçu votre demande de
                    réservation de salle à Vallée du Parc.
                </p>

                <p>
                    Notre équipe analysera votre demande et
                    communiquera avec vous prochainement.
                </p>

                <hr>

                <h3>Résumé de votre demande</h3>

                <p><strong>Date de l'événement :</strong> ${safe.dateEvenement}</p>
                <p><strong>Heure d'arrivée :</strong> ${safe.heureArrivee}</p>
                <p><strong>Nombre de personnes :</strong> ${safe.nombreBar}</p>

                <br>

                <p>Merci d'avoir choisi Vallée du Parc !</p>

                <p><strong>L'équipe de Vallée du Parc</strong></p>
            `
        });

        /* =========================
           REDIRECTION SUCCÈS
        ========================= */

        return res.redirect('/salle_form?success=1');

    } catch (error) {
        const details = getSmtpErrorDetails(error);

        console.error(
            'Erreur formulaire salle - étape :',
            emailStage,
            '- code :',
            details.code,
            '- réponse :',
            details.responseCode,
            '- message :',
            details.message
        );

        return res.redirect('/salle_form?error=1');
    }
});

module.exports = router;