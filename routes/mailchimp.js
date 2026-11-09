const express = require('express');
const router = express.Router();
const mailchimp = require('@mailchimp/mailchimp_marketing');

/* =========================
   VALIDATION COURRIEL
========================= */

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================
   INSCRIPTION NEWSLETTER
========================= */

router.post('/subscribe', async (req, res) => {
    try {
        const body = req.body || {};

        const email =
            typeof body.email === 'string'
                ? body.email.trim().toLowerCase()
                : '';

        const firstName =
            typeof body.firstName === 'string'
                ? body.firstName.trim().slice(0, 50)
                : '';

        /* =========================
           VALIDATION COURRIEL
        ========================= */

        if (!email || !isValidEmail(email) || email.length > 254) {
            return res.redirect('/?error=missing_email');
        }

        /* =========================
           VALIDATION CONFIGURATION
        ========================= */

        const apiKey = process.env.MAILCHIMP_API_KEY;
        const server = process.env.MAILCHIMP_SERVER;
        const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

        if (!apiKey || !server || !audienceId) {
            throw new Error('Configuration Mailchimp incomplète.');
        }

        /* =========================
           CONFIGURATION MAILCHIMP
        ========================= */

        mailchimp.setConfig({
            apiKey,
            server
        });

        /* =========================
           AJOUT DU MEMBRE
        ========================= */

        await mailchimp.lists.addListMember(
            audienceId,
            {
                email_address: email,

                // Double opt-in conservé.
                status: 'pending',

                merge_fields: {
                    FNAME: firstName
                }
            }
        );

        return res.redirect('/?success=1');

    } catch (error) {
        const mailchimpError = error.response?.body || {};

        const errorTitle =
            mailchimpError.title ||
            error.response?.statusText ||
            error.message ||
            'Erreur inconnue';

        /* =========================
           MEMBRE DÉJÀ INSCRIT
        ========================= */

        if (
            errorTitle === 'Member Exists' ||
            errorTitle === 'Member In Pending Status'
        ) {
            return res.redirect('/?exists=1');
        }

        /* =========================
           JOURNALISATION
        ========================= */

        console.error(
            'Erreur Mailchimp :',
            errorTitle
        );

        return res.redirect('/?error=1');
    }
});

module.exports = router;