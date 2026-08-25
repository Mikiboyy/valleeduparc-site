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
   ENVOI FORMULAIRE SALLE
========================= */

router.post('/', async (req, res) => {

    try {

        const {
            client,
            adresse,
            ville,
            codePostal,
            telephone,
            courriel,
            dateEvenement,
            heureArrivee,
            nombreBar,
            message
        } = req.body;


        /* =========================
           VALIDATION
        ========================= */

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


        /* =========================
           COURRIEL À VALLÉE DU PARC
        ========================= */

        await transporter.sendMail({

            from: `"Site Vallée du Parc" <${process.env.SMTP_USER}>`,

            to: process.env.FORM_RECEIVER_SALLE,

            replyTo: courriel,

            subject: `Nouvelle demande de réservation de salle - ${client}`,

            html: `

                <h2>
                    Nouvelle demande de réservation de salle
                </h2>

                <hr>

                <h3>
                    Renseignements du client
                </h3>

                <p>
                    <strong>Client / organisation :</strong>
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

                <p>
                    <strong>Téléphone :</strong>
                    ${telephone}
                </p>

                <p>
                    <strong>Courriel :</strong>
                    ${courriel}
                </p>

                <hr>

                <h3>
                    Informations sur l'événement
                </h3>

                <p>
                    <strong>Date de l'événement :</strong>
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

                <h3>
                    Informations supplémentaires
                </h3>

                <p>
                    ${message || 'Aucun message supplémentaire'}
                </p>

            `

        });


        /* =========================
           CONFIRMATION AU CLIENT
        ========================= */

        await transporter.sendMail({

            from: `"Vallée du Parc" <${process.env.SMTP_USER}>`,

            to: courriel,

            subject: 'Confirmation de votre demande de réservation',

            html: `

                <h2>
                    Bonjour ${client},
                </h2>

                <p>
                    Nous avons bien reçu votre demande de
                    réservation de salle à Vallée du Parc.
                </p>

                <p>
                    Notre équipe analysera votre demande et
                    communiquera avec vous prochainement.
                </p>

                <hr>

                <h3>
                    Résumé de votre demande
                </h3>

                <p>
                    <strong>Date de l'événement :</strong>
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

                <br>

                <p>
                    Merci d'avoir choisi Vallée du Parc !
                </p>

                <p>
                    <strong>
                        L'équipe de Vallée du Parc
                    </strong>
                </p>

            `

        });


        /* =========================
           REDIRECTION SUCCÈS
        ========================= */

        res.redirect(
            '/salle_form?success=1'
        );


    } catch (error) {

        console.error(
            'Erreur formulaire location de salle :',
            error
        );


        res.redirect(
            '/salle_form?error=1'
        );

    }

});


module.exports = router;