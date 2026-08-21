const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');


router.post('/', async (req, res) => {

    try {

        const {
            name,
            email,
            subject,
            message
        } = req.body;


        // Validation
        if (!name || !email || !subject || !message) {

            return res.redirect(
                '/contact?error=Veuillez remplir tous les champs.'
            );

        }


        // Configuration SMTP MailerSend
        const transporter = nodemailer.createTransport({

            host: 'smtp.mailersend.net',

            port: 2525,

            secure: false,

            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }

        });


        // Envoi du courriel
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
                    ${name}
                </p>

                <p>
                    <strong>Courriel :</strong>
                    ${email}
                </p>

                <p>
                    <strong>Sujet :</strong>
                    ${subject}
                </p>

                <hr>

                <p>
                    <strong>Message :</strong>
                </p>

                <p>
                    ${message.replace(/\n/g, '<br>')}
                </p>
            `

        });


        console.log(
            `Message de contact reçu de : ${email}`
        );


        res.redirect(
            '/contact?success=Votre message a été envoyé avec succès.'
        );


    } catch (error) {

        console.error(
            'Erreur formulaire contact :',
            error
        );


        res.redirect(
            '/contact?error=Une erreur est survenue lors de l’envoi du message.'
        );

    }

});


module.exports = router;