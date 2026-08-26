const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');


/* =========================
   CONFIGURATION SMTP
   MAILERSEND
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
   ENVOI DU FORMULAIRE
   CRÉDIT MALADIE
========================= */

router.post('/', async (req, res) => {

    try {

        /*
        =========================
        RÉCUPÉRATION DES DONNÉES
        =========================
        */

        const {

            nom,
            prenom,
            telephone,
            courriel,
            numeroCarte,
            message

        } = req.body;


        /*
        =========================
        VALIDATION
        =========================
        */

        if (
            !nom ||
            !prenom ||
            !telephone ||
            !courriel
        ) {

            throw new Error(
                'Informations obligatoires manquantes'
            );

        }


        /*
        =========================
        COURRIEL À VALLÉE DU PARC
        =========================
        */

        await transporter.sendMail({

            from:
                `"Site Vallée du Parc" <${process.env.SMTP_USER}>`,

            to:
                process.env.FORM_RECEIVER_CREDIT_MALADIE,

            replyTo:
                courriel,

            subject:
                `Nouvelle demande de crédit maladie - ${prenom} ${nom}`,

            html: `

                <h2>
                    Nouvelle demande de crédit maladie
                </h2>

                <hr>

                <h3>
                    Informations du client
                </h3>

                <p>
                    <strong>Prénom :</strong>
                    ${prenom}
                </p>

                <p>
                    <strong>Nom :</strong>
                    ${nom}
                </p>

                <p>
                    <strong>Téléphone :</strong>
                    ${telephone}
                </p>

                <p>
                    <strong>Courriel :</strong>
                    ${courriel}
                </p>

                <p>
                    <strong>Numéro de carte :</strong>
                    ${numeroCarte || 'Non précisé'}
                </p>

                <hr>

                <h3>
                    Message
                </h3>

                <p>
                    ${message || 'Aucun message'}
                </p>

            `

        });


        /*
        =========================
        CONFIRMATION AU CLIENT
        =========================
        */

        await transporter.sendMail({

            from:
                `"Vallée du Parc" <${process.env.SMTP_USER}>`,

            to:
                courriel,

            subject:
                'Confirmation de réception de votre demande',

            html: `

                <h2>
                    Bonjour ${prenom},
                </h2>

                <p>
                    Nous avons bien reçu votre demande
                    concernant un crédit maladie.
                </p>

                <p>
                    Notre équipe analysera votre demande
                    et communiquera avec vous prochainement.
                </p>

                <br>

                <p>
                    Merci,
                </p>

                <p>
                    <strong>
                        L'équipe de Vallée du Parc
                    </strong>
                </p>

            `

        });


        /*
        =========================
        REDIRECTION SUCCÈS
        =========================
        */

        res.redirect(
            '/faq?credit-success=1'
        );


    } catch (error) {

        console.error(
            'Erreur formulaire crédit maladie :',
            error
        );


        /*
        =========================
        REDIRECTION ERREUR
        =========================
        */

        res.redirect(
            '/faq?credit-error=1'
        );

    }

});


module.exports = router;