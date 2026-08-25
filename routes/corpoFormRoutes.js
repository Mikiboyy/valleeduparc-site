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
========================= */

router.post('/', async (req, res) => {

    try {

        /*
        =========================
        RÉCUPÉRATION DES DONNÉES
        =========================
        */

        const {
            client,
            adresse,
            ville,
            codePostal,
            telephone,
            courriel,
            dateEvenement,
            heureArrivee,
            nombrePersonnes,
            message
        } = req.body;


        /*
        =========================
        VALIDATION
        =========================
        */

        if (
            !client ||
            !telephone ||
            !courriel ||
            !dateEvenement
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

            from: `"Site Vallée du Parc" <${process.env.SMTP_USER}>`,

            to: process.env.FORM_RECEIVER_CORPO,

            replyTo: courriel,

            subject:
                `Nouvelle demande d'activité - ${client}`,

            html: `

                <h2>
                    Nouvelle demande d'activité
                </h2>

                <hr>

                <h3>Client / organisation</h3>

                <p>
                    <strong>Client :</strong>
                    ${client}
                </p>

                <p>
                    <strong>Adresse :</strong>
                    ${adresse || 'Non précisée'}
                </p>

                <p>
                    <strong>Ville :</strong>
                    ${ville || 'Non précisée'}
                </p>

                <p>
                    <strong>Code postal :</strong>
                    ${codePostal || 'Non précisé'}
                </p>

                <hr>

                <h3>Coordonnées</h3>

                <p>
                    <strong>Téléphone :</strong>
                    ${telephone}
                </p>

                <p>
                    <strong>Courriel :</strong>
                    ${courriel}
                </p>

                <hr>

                <h3>Événement</h3>

                <p>
                    <strong>Date :</strong>
                    ${dateEvenement}
                </p>

                <p>
                    <strong>Heure d'arrivée :</strong>
                    ${heureArrivee || 'Non précisée'}
                </p>

                <p>
                    <strong>Nombre de personnes :</strong>
                    ${nombreBar || 'Non précisé'}
                </p>

                <hr>

                <h3>Message</h3>

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

            to: courriel,

            subject:
                'Confirmation de réception de votre demande',

            html: `

                <h2>
                    Bonjour ${client},
                </h2>

                <p>
                    Nous avons bien reçu votre demande
                    d'activité à Vallée du Parc.
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
            '/corpo_form?success=1'
        );


    } catch (error) {

        console.error(
            'Erreur formulaire corporatif :',
            error
        );

        res.redirect(
            '/corpo_form?error=1'
        );

    }

});


module.exports = router;