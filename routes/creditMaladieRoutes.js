const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');


/* =========================
   CONFIGURATION MULTER
========================= */

const storage = multer.memoryStorage();

const upload = multer({
    storage
});


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

router.post(
    '/',
    upload.single('preuveMedicale'),
    async (req, res) => {

        try {

            console.log(
                'BODY REÇU :',
                req.body
            );

            console.log(
                'FICHIER REÇU :',
                req.file
                    ? req.file.originalname
                    : 'Aucun fichier'
            );


            /*
            =========================
            RÉCUPÉRATION DES DONNÉES
            =========================
            */

            const {

                nom,
                prenom,
                adresse,

                telephone,
                telephoneCellulaire,
                telephoneBureau,

                courriel,

                prenomDetenteur,
                nomDetenteur,

                numeroClient,

                produits,
                demande,

                commentaires

            } = req.body || {};


            /*
            =========================
            VALIDATION
            =========================
            */

            if (
                !nom ||
                !prenom ||
                !adresse ||
                !telephone ||
                !courriel ||
                !demande
            ) {

                throw new Error(
                    'Informations obligatoires manquantes'
                );

            }


            /*
            =========================
            VALIDATION PRODUITS
            =========================
            */

            if (
                !produits ||
                (
                    Array.isArray(produits) &&
                    produits.length === 0
                )
            ) {

                throw new Error(
                    'Veuillez sélectionner au moins un produit'
                );

            }


            /*
            =========================
            VALIDATION FICHIER
            =========================
            */

            if (!req.file) {

                throw new Error(
                    'Une preuve médicale est obligatoire'
                );

            }


            /*
            =========================
            FORMAT DES PRODUITS
            =========================
            */

            const produitsSelectionnes =
                Array.isArray(produits)
                    ? produits.join(', ')
                    : produits;


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


                attachments: [

                    {
                        filename:
                            req.file.originalname,

                        content:
                            req.file.buffer,

                        contentType:
                            req.file.mimetype
                    }

                ],


                html: `

                    <h2>
                        Nouvelle demande de crédit / remboursement maladie
                    </h2>

                    <hr>


                    <h3>
                        Informations du client payeur
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
                        <strong>Adresse :</strong>
                        ${adresse}
                    </p>


                    <hr>


                    <h3>
                        Coordonnées
                    </h3>

                    <p>
                        <strong>Téléphone principal :</strong>
                        ${telephone}
                    </p>

                    <p>
                        <strong>Téléphone cellulaire :</strong>
                        ${
                            telephoneCellulaire ||
                            'Non précisé'
                        }
                    </p>

                    <p>
                        <strong>Téléphone bureau :</strong>
                        ${
                            telephoneBureau ||
                            'Non précisé'
                        }
                    </p>

                    <p>
                        <strong>Courriel :</strong>
                        ${courriel}
                    </p>


                    <hr>


                    <h3>
                        Détenteur de l'abonnement
                    </h3>

                    <p>
                        <strong>Prénom :</strong>
                        ${
                            prenomDetenteur ||
                            'Non précisé'
                        }
                    </p>

                    <p>
                        <strong>Nom :</strong>
                        ${
                            nomDetenteur ||
                            'Non précisé'
                        }
                    </p>


                    <hr>


                    <h3>
                        Informations supplémentaires
                    </h3>

                    <p>
                        <strong>Numéro de client ou facture :</strong>
                        ${
                            numeroClient ||
                            'Non précisé'
                        }
                    </p>

                    <p>
                        <strong>Produits :</strong>
                        ${produitsSelectionnes}
                    </p>

                    <p>
                        <strong>Type de demande :</strong>
                        ${
                            demande === 'credit'
                                ? 'Crédit'
                                : 'Remboursement'
                        }
                    </p>


                    <hr>


                    <h3>
                        Commentaires
                    </h3>

                    <p>
                        ${
                            commentaires ||
                            'Aucun commentaire'
                        }
                    </p>


                    <hr>


                    <h3>
                        Preuve médicale
                    </h3>

                    <p>
                        Le document suivant est joint à ce courriel :
                        <strong>
                            ${req.file.originalname}
                        </strong>
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
                        de ${
                            demande === 'credit'
                                ? 'crédit'
                                : 'remboursement'
                        }.
                    </p>

                    <p>
                        Notre équipe analysera votre demande
                        ainsi que les documents fournis.
                    </p>

                    <p>
                        Veuillez noter qu'un délai pouvant aller
                        jusqu'à <strong>3 semaines</strong>
                        peut être nécessaire pour le traitement
                        de votre demande.
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

    }
);


module.exports = router;