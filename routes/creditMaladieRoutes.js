const express = require('express');

const router = express.Router();


/* =========================================
   PROTECTION HTML
========================================= */

function escapeHtml(value) {

    if (value === undefined || value === null) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* =========================================
   ENVOY COURRIEL MAILERSEND
========================================= */

async function sendEmail({
    to,
    subject,
    html,
    text,
    replyTo
}) {

    const response = await fetch(
        'https://api.mailersend.com/v1/email',
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',

                'Authorization':
                    `Bearer ${process.env.MAILERSEND_API_KEY}`
            },

            body: JSON.stringify({

                from: {
                    email: process.env.MAILERSEND_FROM_EMAIL,
                    name: process.env.MAILERSEND_FROM_NAME
                        || 'Vallée du Parc'
                },

                to: [
                    {
                        email: to
                    }
                ],

                reply_to: replyTo
                    ? {
                        email: replyTo.email,
                        name: replyTo.name
                    }
                    : undefined,

                subject,

                html,

                text
            })
        }
    );


    if (!response.ok) {

        const errorText = await response.text();

        console.error(
            'Erreur MailerSend :',
            errorText
        );

        throw new Error(
            `MailerSend a retourné le statut ${response.status}`
        );
    }


    return response;
}


/* =========================================
   POST
   DEMANDE DE CRÉDIT - MALADIE
========================================= */

router.post(
    '/',
    async (req, res) => {

        try {

            /*
             =========================================
             RÉCUPÉRATION DES DONNÉES
             =========================================
            */

            const {

                firstName,
                lastName,
                email,
                phone,

                childName,
                childAge,

                sickness,
                absenceStartDate,
                absenceEndDate,

                message

            } = req.body;


            /*
             =========================================
             VALIDATION MINIMALE
             =========================================
            */

            if (
                !firstName ||
                !lastName ||
                !email
            ) {

                return res.redirect(
                    '/demande-credit-maladie?error=missing'
                );
            }


            /*
             =========================================
             VALEURS PROTÉGÉES POUR LE HTML
             =========================================
            */

            const safeFirstName =
                escapeHtml(firstName);

            const safeLastName =
                escapeHtml(lastName);

            const safeEmail =
                escapeHtml(email);

            const safePhone =
                escapeHtml(phone);

            const safeChildName =
                escapeHtml(childName);

            const safeChildAge =
                escapeHtml(childAge);

            const safeSickness =
                escapeHtml(sickness);

            const safeAbsenceStartDate =
                escapeHtml(absenceStartDate);

            const safeAbsenceEndDate =
                escapeHtml(absenceEndDate);

            const safeMessage =
                escapeHtml(message)
                    .replace(/\n/g, '<br>');


            /*
             =========================================
             COURRIEL POUR VALLÉE DU PARC
             =========================================
            */

            const adminHtml = `

                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 700px;
                    margin: 0 auto;
                    color: #24344d;
                ">

                    <h1 style="
                        color: #1f9bc1;
                    ">
                        Nouvelle demande de crédit - maladie
                    </h1>

                    <p>
                        Une nouvelle demande vient d'être envoyée
                        depuis le site web de Vallée du Parc.
                    </p>

                    <hr>

                    <h2>
                        Informations du demandeur
                    </h2>

                    <table style="
                        width: 100%;
                        border-collapse: collapse;
                    ">

                        <tr>
                            <td style="
                                padding: 10px;
                                font-weight: bold;
                            ">
                                Prénom
                            </td>

                            <td style="
                                padding: 10px;
                            ">
                                ${safeFirstName}
                            </td>
                        </tr>


                        <tr>
                            <td style="
                                padding: 10px;
                                font-weight: bold;
                            ">
                                Nom
                            </td>

                            <td style="
                                padding: 10px;
                            ">
                                ${safeLastName}
                            </td>
                        </tr>


                        <tr>
                            <td style="
                                padding: 10px;
                                font-weight: bold;
                            ">
                                Courriel
                            </td>

                            <td style="
                                padding: 10px;
                            ">
                                ${safeEmail}
                            </td>
                        </tr>


                        <tr>
                            <td style="
                                padding: 10px;
                                font-weight: bold;
                            ">
                                Téléphone
                            </td>

                            <td style="
                                padding: 10px;
                            ">
                                ${safePhone || 'Non indiqué'}
                            </td>
                        </tr>

                    </table>


                    <hr>


                    <h2>
                        Informations concernant la demande
                    </h2>


                    <table style="
                        width: 100%;
                        border-collapse: collapse;
                    ">

                        <tr>
                            <td style="
                                padding: 10px;
                                font-weight: bold;
                            ">
                                Nom de l'enfant
                            </td>

                            <td style="
                                padding: 10px;
                            ">
                                ${safeChildName || 'Non indiqué'}
                            </td>
                        </tr>


                        <tr>
                            <td style="
                                padding: 10px;
                                font-weight: bold;
                            ">
                                Âge
                            </td>

                            <td style="
                                padding: 10px;
                            ">
                                ${safeChildAge || 'Non indiqué'}
                            </td>
                        </tr>


                        <tr>
                            <td style="
                                padding: 10px;
                                font-weight: bold;
                            ">
                                Motif
                            </td>

                            <td style="
                                padding: 10px;
                            ">
                                ${safeSickness || 'Non indiqué'}
                            </td>
                        </tr>


                        <tr>
                            <td style="
                                padding: 10px;
                                font-weight: bold;
                            ">
                                Début de l'absence
                            </td>

                            <td style="
                                padding: 10px;
                            ">
                                ${safeAbsenceStartDate || 'Non indiqué'}
                            </td>
                        </tr>


                        <tr>
                            <td style="
                                padding: 10px;
                                font-weight: bold;
                            ">
                                Fin de l'absence
                            </td>

                            <td style="
                                padding: 10px;
                            ">
                                ${safeAbsenceEndDate || 'Non indiqué'}
                            </td>
                        </tr>

                    </table>


                    <hr>


                    <h2>
                        Message supplémentaire
                    </h2>

                    <p>
                        ${safeMessage || 'Aucun message supplémentaire.'}
                    </p>


                    <hr>


                    <p style="
                        font-size: 12px;
                        color: #777;
                    ">
                        Ce courriel a été envoyé automatiquement
                        depuis le formulaire de demande de crédit-maladie
                        du site web de Vallée du Parc.
                    </p>

                </div>
            `;


            const adminText = `

Nouvelle demande de crédit - maladie

INFORMATIONS DU DEMANDEUR

Prénom : ${firstName}
Nom : ${lastName}
Courriel : ${email}
Téléphone : ${phone || 'Non indiqué'}

INFORMATIONS DE LA DEMANDE

Nom de l'enfant : ${childName || 'Non indiqué'}
Âge : ${childAge || 'Non indiqué'}
Motif : ${sickness || 'Non indiqué'}

Début de l'absence :
${absenceStartDate || 'Non indiqué'}

Fin de l'absence :
${absenceEndDate || 'Non indiqué'}

MESSAGE

${message || 'Aucun message supplémentaire.'}

            `;


            /*
             =========================================
             ENVOI À VALLÉE DU PARC
             =========================================

             Change l'adresse ci-dessous pour
             l'adresse qui doit recevoir les demandes.
            */

            await sendEmail({

                to:
                    process.env.CREDIT_MALADIE_TO_EMAIL,

                subject:
                    `Nouvelle demande de crédit - maladie - ${firstName} ${lastName}`,

                html:
                    adminHtml,

                text:
                    adminText,

                replyTo: {
                    email,
                    name:
                        `${firstName} ${lastName}`
                }

            });


            /*
             =========================================
             COURRIEL DE CONFIRMATION AU CLIENT
             =========================================
            */

            const confirmationHtml = `

                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 650px;
                    margin: 0 auto;
                    color: #24344d;
                ">

                    <h1 style="
                        color: #1f9bc1;
                    ">
                        Demande reçue
                    </h1>


                    <p>
                        Bonjour ${safeFirstName},
                    </p>


                    <p>
                        Nous avons bien reçu votre demande
                        de crédit pour maladie.
                    </p>


                    <p>
                        Notre équipe analysera votre demande
                        et communiquera avec vous au besoin.
                    </p>


                    <p>
                        Merci,
                    </p>


                    <p>
                        <strong>
                            L'équipe de Vallée du Parc
                        </strong>
                    </p>

                </div>
            `;


            const confirmationText = `

Bonjour ${firstName},

Nous avons bien reçu votre demande de crédit pour maladie.

Notre équipe analysera votre demande et communiquera avec vous au besoin.

Merci,

L'équipe de Vallée du Parc

            `;


            await sendEmail({

                to: email,

                subject:
                    'Confirmation de votre demande de crédit - maladie',

                html:
                    confirmationHtml,

                text:
                    confirmationText

            });


            /*
             =========================================
             SUCCÈS
             =========================================
            */

            return res.redirect(
                '/demande-credit-maladie?success=true'
            );


        } catch (error) {

            console.error(
                'Erreur demande crédit-maladie :',
                error
            );


            return res.redirect(
                '/demande-credit-maladie?error=true'
            );
        }

    }
);


module.exports = router;