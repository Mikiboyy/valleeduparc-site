
const express = require('express');
const router = express.Router();
const mailchimp = require('@mailchimp/mailchimp_marketing');

// Configuration Mailchimp
mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER
});

router.post('/subscribe', async (req, res) => {

    // Protection contre les requêtes sans body
    const { email, firstName } = req.body || {};

    // Vérification de l'adresse courriel
    if (
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        return res.redirect('/?error=missing_email');
    }

    // Vérification du prénom
    const safeFirstName =
        typeof firstName === 'string'
            ? firstName.trim().slice(0, 50)
            : '';

    try {
        await mailchimp.lists.addListMember(
            process.env.MAILCHIMP_AUDIENCE_ID,
            {
                email_address: email.trim().toLowerCase(),
                status: "pending",
                merge_fields: {
                    FNAME: safeFirstName
                }
            }
        );

        return res.redirect('/?success=1');

    } catch (error) {

        const mailchimpError = error.response?.body;

        // Déjà inscrit
        if (mailchimpError?.title === "Member Exists") {
            return res.redirect('/?exists=1');
        }

        // Adresse déjà en attente
        if (mailchimpError?.title === "Member In Pending Status") {
            return res.redirect('/?exists=1');
        }

        console.error(
            "Mailchimp error:",
            mailchimpError?.title || error.message
        );

        return res.redirect('/?error=1');
    }
});

module.exports = router;
