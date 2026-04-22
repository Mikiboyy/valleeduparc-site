const express = require('express');
const router = express.Router();
const mailchimp = require('@mailchimp/mailchimp_marketing');

mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER
});

router.post('/subscribe', async (req, res) => {
    const { email, firstName } = req.body;

    try {
        await mailchimp.lists.addListMember(
            process.env.MAILCHIMP_AUDIENCE_ID,
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName
                }
            }
        );

        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.send("Erreur inscription infolettre");
    }
});

module.exports = router;