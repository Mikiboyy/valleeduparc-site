const express = require('express');
const router = express.Router();
const mailchimp = require('@mailchimp/mailchimp_marketing');

mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER
});

router.post('/subscribe', async (req, res) => {
    const { email, firstName } = req.body;

    if (!email) {
        return res.redirect('/?error=missing_email');
    }

    try {
        await mailchimp.lists.addListMember(
            process.env.MAILCHIMP_AUDIENCE_ID,
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName || ""
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

        console.log("Mailchimp error:", mailchimpError || error);

        return res.redirect('/?error=1');
    }
});

module.exports = router;