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
        fileSize: 5 * 1024 * 1024 // 5 MB max par fichier
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
            cb(new Error('Format de fichier non accepté'));
        }
    }
});

/* =========================
   CONFIGURATION SMTP
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
        { name: 'cv', maxCount: 1 },
        { name: 'lettre', maxCount: 1 }
    ]),
    async (req, res) => {

        try {

            const {
                prenom,
                nom,
                email,
                telephone,
                poste,
                message
            } = req.body;

            const cv = req.files?.cv?.[0];
            const lettre = req.files?.lettre?.[0];

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

                from: `"Site Vallée du Parc" <${process.env.SMTP_USER}>`,

                to: process.env.FORM_RECEIVER_CARRIERES,

                replyTo: email,

                subject: `Nouvelle candidature - ${prenom} ${nom}`,

                html: `
                    <h2>Nouvelle candidature reçue</h2>

                    <hr>

                    <p><strong>Prénom :</strong> ${prenom}</p>
                    <p><strong>Nom :</strong> ${nom}</p>
                    <p><strong>Courriel :</strong> ${email}</p>
                    <p><strong>Téléphone :</strong> ${telephone}</p>

                    <hr>

                    <p><strong>Poste :</strong> ${poste || 'Non précisé'}</p>

                    <h3>Message</h3>
                    <p>${message || 'Aucun message'}</p>
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

            // Supprime les fichiers temporaires après l'envoi
            if (cv) fs.unlinkSync(cv.path);
            if (lettre) fs.unlinkSync(lettre.path);

            res.redirect('/carrieres?success=1');

        } catch (error) {

            console.error('Erreur formulaire carrières :', error);

            res.redirect('/carrieres?error=1');

        }

    }
);

module.exports = router;