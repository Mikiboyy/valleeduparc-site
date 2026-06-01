const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.get('/', (req, res) => {

    res.render('ecole/inscription', {
        title: "Inscription aux cours",
        returnUrl: req.query.returnUrl || '/'
    });

});

router.post('/', async (req, res) => {

    try {

        const {
            eleveNom,
            eleveNaissance,
            eleveNiveau,
            parentNom,
            parentNaissance,
            telephone,
            email,
            duree,
            horaire,
            commentaires,
            returnUrl
        } = req.body;

        // Validation minimale
        if (!eleveNom || !parentNom || !telephone || !email) {
            return res.redirect('/inscription?error=1');
        }


        console.log("SMTP_HOST =", process.env.SMTP_HOST);
        console.log("SMTP_PORT =", process.env.SMTP_PORT);
        console.log("SMTP_USER =", process.env.SMTP_USER);
        console.log("MAIL_FROM =", process.env.MAIL_FROM);

        const transporter = nodemailer.createTransport({

            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,

            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },

            tls: {
                rejectUnauthorized: false
            }

        });

        await transporter.sendMail({

            from: `"Formulaire Vallée du Parc" <${process.env.SMTP_USER}>`,

            to: process.env.FORM_RECEIVER,

            replyTo: email,

            subject: 'Nouvelle inscription à un cours',

            html: `
                <h2>Nouvelle inscription à un cours</h2>

                <hr>

                <h3>Informations de l'élève</h3>

                <p><strong>Nom :</strong> ${eleveNom}</p>

                <p><strong>Date de naissance :</strong> ${eleveNaissance || 'Non précisée'}</p>

                <p><strong>Niveau saison 2024-2025 :</strong> ${eleveNiveau || 'Non précisé'}</p>

                <hr>

                <h3>Coordonnées du parent</h3>

                <p><strong>Nom :</strong> ${parentNom}</p>

                <p><strong>Date de naissance :</strong> ${parentNaissance || 'Non précisée'}</p>

                <p><strong>Téléphone :</strong> ${telephone}</p>

                <p><strong>Courriel :</strong> ${email}</p>

                <hr>

                <h3>Préférences horaires</h3>

                <p>
                    <strong>Durée :</strong>
                    ${Array.isArray(duree)
                        ? duree.join(', ')
                        : duree || 'Non précisée'}
                </p>

                <p>
                    <strong>Horaire :</strong>
                    ${Array.isArray(horaire)
                        ? horaire.join(', ')
                        : horaire || 'Non précisé'}
                </p>

                <hr>

                <h3>Commentaires</h3>

                <p>${commentaires || 'Aucun commentaire'}</p>
            `
        });

        console.log('✅ Courriel envoyé avec succès');

        res.redirect(`${returnUrl || '/'}?success=1`);

    } catch (error) {

        console.error('❌ Erreur MailerSend :');
        console.error(error);

        res.redirect(`${returnUrl || '/inscription'}?error=1`);
    }

});

module.exports = router;