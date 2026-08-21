const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');

/* =========================
   UPLOAD DES FICHIERS
========================= */

const upload = multer({
    dest: 'uploads/candidatures/',

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error('Format de fichier non accepté')
            );
        }

    }
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
   POSTULER
========================= */

router.post(
    '/',

    upload.fields([
        {
            name: 'cv',
            maxCount: 1
        },
        {
            name: 'lettre',
            maxCount: 1
        }
    ]),

    async (req, res) => {

        const cv = req.files?.cv?.[0];
        const lettre = req.files?.lettre?.[0];

        try {

            const {
                prenom,
                nom,
                email,
                telephone,
                poste,
                message
            } = req.body;


            /* =========================
               VALIDATION
            ========================= */

            if (
                !prenom ||
                !nom ||
                !email
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

                to: process.env.FORM_RECEIVER_CARRIERES,

                replyTo: email,

                subject: `Nouvelle candidature - ${prenom} ${nom}`,

                html: `

                    <h2>Nouvelle candidature reçue</h2>

                    <hr>

                    <p>
                        <strong>Prénom :</strong>
                        ${prenom}
                    </p>

                    <p>
                        <strong>Nom :</strong>
                        ${nom}
                    </p>

                    <p>
                        <strong>Courriel :</strong>
                        ${email}
                    </p>

                    <p>
                        <strong>Téléphone :</strong>
                        ${telephone || 'Non précisé'}
                    </p>

                    <hr>

                    <p>
                        <strong>Poste :</strong>
                        ${poste || 'Non précisé'}
                    </p>

                    <h3>Message</h3>

                    <p>
                        ${message || 'Aucun message'}
                    </p>

                `,

                attachments: [

                    ...(cv ? [{
                        filename: cv.originalname,
                        path: cv.path
                    }] : []),

                    ...(lettre ? [{
                        filename: lettre.originalname,
                        path: lettre.path
                    }] : [])

                ]

            });


            /* =========================
               CONFIRMATION AU CANDIDAT
            ========================= */

            await transporter.sendMail({

                from: `"Vallée du Parc" <${process.env.SMTP_USER}>`,

                to: email,

                subject: 'Confirmation de réception de votre candidature',

                html: `

                    <h2>Bonjour ${prenom},</h2>

                    <p>
                        Nous avons bien reçu votre candidature
                        et nous vous remercions de votre intérêt
                        envers Vallée du Parc.
                    </p>

                    <p>
                        Votre candidature a été transmise
                        à notre équipe.
                    </p>

                    <p>
                        Si votre profil correspond aux besoins
                        du poste, nous communiquerons avec vous.
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


            /* =========================
               SUPPRESSION DES FICHIERS
            ========================= */

            if (cv && fs.existsSync(cv.path)) {

                fs.unlinkSync(cv.path);

            }

            if (
                lettre &&
                fs.existsSync(lettre.path)
            ) {

                fs.unlinkSync(lettre.path);

            }


            /* =========================
               REDIRECTION SUCCÈS
            ========================= */

            res.redirect(
                '/carrieres?success=1'
            );


        } catch (error) {

            console.error(
                'Erreur formulaire carrières :',
                error
            );


            /* =========================
               SUPPRESSION DES FICHIERS
               EN CAS D'ERREUR
            ========================= */

            if (
                cv &&
                fs.existsSync(cv.path)
            ) {

                fs.unlinkSync(cv.path);

            }

            if (
                lettre &&
                fs.existsSync(lettre.path)
            ) {

                fs.unlinkSync(lettre.path);

            }


            res.redirect(
                '/carrieres?error=1'
            );

        }

    }

);


/* =========================
   GESTION ERREURS MULTER
========================= */

router.use((error, req, res, next) => {

    if (error) {

        console.error(
            'Erreur upload carrière :',
            error.message
        );

        return res.redirect(
            '/carrieres?error=1'
        );

    }

    next();

});


module.exports = router;