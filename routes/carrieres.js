const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

/* =========================
   CONFIGURATION UPLOAD
========================= */

const upload = multer({
    dest: 'uploads/candidatures/',

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 2,
        fields: 20,
        fieldSize: 10 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        const extension = path.extname(file.originalname).toLowerCase();
        const expectedMime = allowedTypes[extension];

        if (!expectedMime || file.mimetype !== expectedMime) {
            return cb(new Error('Format de fichier non accepté'));
        }

        cb(null, true);
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
   FONCTIONS UTILITAIRES
========================= */

function cleanValue(value, maxLength = 2000) {
    if (typeof value !== 'string') return '';

    return value.trim().slice(0, maxLength);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeFilename(filename) {
    const extension = path.extname(filename).toLowerCase();

    const basename = path.basename(filename, extension)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 80);

    return `${basename || 'document'}${extension}`;
}

async function deleteUploadedFiles(files) {
    if (!files) return;

    const allFiles = Object.values(files).flat();

    await Promise.all(
        allFiles.map(async (file) => {
            if (!file || !file.path) return;

            try {
                await fs.promises.unlink(file.path);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error(
                        'Erreur suppression fichier temporaire :',
                        error.message
                    );
                }
            }
        })
    );
}

/*
   Vérification de la signature réelle du fichier.
   Cela ajoute une vérification au-delà du MIME
   et de l'extension fournis par le navigateur.
*/

async function validateFileSignature(file) {
    const buffer = await fs.promises.readFile(file.path);

    const extension = path.extname(file.originalname).toLowerCase();

    if (extension === '.pdf') {
        return buffer.subarray(0, 5).toString() === '%PDF-';
    }

    if (extension === '.doc') {
        return buffer.subarray(0, 8).equals(
            Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])
        );
    }

    if (extension === '.docx') {
        return buffer.subarray(0, 2).equals(
            Buffer.from([0x50, 0x4B])
        );
    }

    return false;
}

/* =========================
   GESTION DU TÉLÉVERSEMENT
========================= */

function handleUpload(req, res, next) {
    upload.fields([
        {
            name: 'cv',
            maxCount: 1
        },
        {
            name: 'lettre',
            maxCount: 1
        }
    ])(req, res, async (error) => {
        if (error) {
            await deleteUploadedFiles(req.files);

            console.error(
                'Erreur upload carrière :',
                error.message
            );

            return res.redirect('/carrieres?error=1');
        }

        next();
    });
}

/* =========================
   POSTULER
========================= */

router.post('/', handleUpload, async (req, res) => {
    const cv = req.files?.cv?.[0];
    const lettre = req.files?.lettre?.[0];

    let emailStage = 'validation';

    try {
        const body = req.body || {};

        const prenom = cleanValue(body.prenom, 100);
        const nom = cleanValue(body.nom, 100);
        const email = cleanValue(body.email, 254).toLowerCase();
        const telephone = cleanValue(body.telephone, 50);
        const poste = cleanValue(body.poste, 200);
        const message = cleanValue(body.message, 3000);

        /* =========================
           VALIDATION
        ========================= */

        if (!prenom || !nom || !email) {
            throw new Error('Informations obligatoires manquantes');
        }

        if (!isValidEmail(email)) {
            throw new Error('Adresse courriel invalide');
        }

        if (
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASS ||
            !process.env.FORM_RECEIVER_CARRIERES
        ) {
            throw new Error('Configuration SMTP ou destinataire manquant');
        }

        /* =========================
           VALIDATION DES FICHIERS
        ========================= */

        if (cv && !(await validateFileSignature(cv))) {
            throw new Error('Le fichier CV ne semble pas être valide');
        }

        if (lettre && !(await validateFileSignature(lettre))) {
            throw new Error('La lettre de présentation ne semble pas être valide');
        }

        /* =========================
           PRÉPARATION HTML SÉCURISÉE
        ========================= */

        const safe = {
            prenom: escapeHtml(prenom),
            nom: escapeHtml(nom),
            email: escapeHtml(email),
            telephone: escapeHtml(telephone || 'Non précisé'),
            poste: escapeHtml(poste || 'Non précisé'),
            message: escapeHtml(message || 'Aucun message')
                .replace(/\n/g, '<br>')
        };

        /* =========================
           PRÉPARATION DES PIÈCES JOINTES
        ========================= */

        const attachments = [];

        if (cv) {
            attachments.push({
                filename: safeFilename(cv.originalname),
                path: cv.path
            });
        }

        if (lettre) {
            attachments.push({
                filename: safeFilename(lettre.originalname),
                path: lettre.path
            });
        }

        /* =========================
           COURRIEL À VALLÉE DU PARC
        ========================= */

        emailStage = 'notification_station';

        await transporter.sendMail({
            from: `"Site Vallée du Parc" <${process.env.SMTP_USER}>`,
            to: process.env.FORM_RECEIVER_CARRIERES,
            replyTo: email,
            subject: `Nouvelle candidature - ${prenom} ${nom}`,

            html: `
                <h2>Nouvelle candidature reçue</h2>
                <hr>

                <p><strong>Prénom :</strong> ${safe.prenom}</p>
                <p><strong>Nom :</strong> ${safe.nom}</p>
                <p><strong>Courriel :</strong> ${safe.email}</p>
                <p><strong>Téléphone :</strong> ${safe.telephone}</p>

                <hr>

                <p><strong>Poste :</strong> ${safe.poste}</p>

                <h3>Message</h3>
                <p>${safe.message}</p>

                <hr>

                <p>
                    Les documents transmis par le candidat
                    sont joints à ce courriel.
                </p>
            `,

            attachments
        });

        /* =========================
           CONFIRMATION AU CANDIDAT
        ========================= */

        emailStage = 'confirmation_candidat';

        await transporter.sendMail({
            from: `"Vallée du Parc" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Confirmation de réception de votre candidature',

            html: `
                <h2>Bonjour ${safe.prenom},</h2>

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

                <p>Merci,</p>

                <p><strong>L'équipe de Vallée du Parc</strong></p>
            `
        });

        /* =========================
           REDIRECTION SUCCÈS
        ========================= */

        return res.redirect('/carrieres?success=1');

    } catch (error) {
        console.error(
            'Erreur formulaire carrières - étape :',
            emailStage,
            '- code :',
            error.code || 'N/A',
            '- réponse :',
            error.responseCode || 'N/A',
            '- message :',
            error.message || 'Erreur inconnue'
        );

        return res.redirect('/carrieres?error=1');

    } finally {
        await deleteUploadedFiles(req.files);
    }
});

module.exports = router;