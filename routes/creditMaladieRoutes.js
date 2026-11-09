
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');

// =========================
// CONFIGURATION FICHIERS
// =========================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

const allowedFiles = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
};

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
        fields: 20,
        fieldSize: 10 * 1024
    },

    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const expectedMime = allowedFiles[extension];

        if (!expectedMime || file.mimetype !== expectedMime) {
            return callback(
                new Error('Format de fichier non autorisé.')
            );
        }

        callback(null, true);
    }
});

// Gestion des erreurs Multer
const handleUpload = (req, res, next) => {
    upload.single('preuveMedicale')(req, res, (error) => {
        if (error) {
            console.warn('Téléversement refusé :', error.code || 'Erreur fichier');

            return res.redirect('/faq?credit-error=1');
        }

        next();
    });
};

// =========================
// CONFIGURATION SMTP
// MAILERSEND
// =========================

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

// =========================
// FONCTIONS DE VALIDATION
// =========================

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function cleanValue(value, maxLength = 500) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().slice(0, maxLength);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeFilename(filename) {
    const extension = path.extname(filename).toLowerCase();

    const basename = path.basename(filename, extension)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 80);

    return `${basename || 'preuve_medicale'}${extension}`;
}

// Vérification réelle du contenu du fichier
function validateFileSignature(file) {
    const buffer = file.buffer;
    const extension = path.extname(file.originalname).toLowerCase();

    if (!buffer || buffer.length < 4) {
        return false;
    }

    switch (extension) {
        case '.pdf':
            return buffer.subarray(0, 5).toString() === '%PDF-';

        case '.jpg':
        case '.jpeg':
            return (
                buffer[0] === 0xFF &&
                buffer[1] === 0xD8 &&
                buffer[2] === 0xFF
            );

        case '.png':
            return buffer.subarray(0, 8).equals(
                Buffer.from([
                    0x89, 0x50, 0x4E, 0x47,
                    0x0D, 0x0A, 0x1A, 0x0A
                ])
            );

        default:
            return false;
    }
}

// =========================
// ENVOI DU FORMULAIRE
// CRÉDIT MALADIE
// =========================

router.post('/', handleUpload, async (req, res) => {

    try {

        // =========================
        // VÉRIFICATION CONFIGURATION
        // =========================

        if (
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASS ||
            !process.env.FORM_RECEIVER_CREDIT_MALADIE
        ) {
            throw new Error('Configuration SMTP incomplète.');
        }

        // =========================
        // RÉCUPÉRATION DES DONNÉES
        // =========================

        const body = req.body || {};

        const nom = cleanValue(body.nom, 100);
        const prenom = cleanValue(body.prenom, 100);
        const adresse = cleanValue(body.adresse, 300);

        const telephone = cleanValue(body.telephone, 40);
        const telephoneCellulaire = cleanValue(body.telephoneCellulaire, 40);
        const telephoneBureau = cleanValue(body.telephoneBureau, 40);

        const courriel = cleanValue(body.courriel, 254).toLowerCase();

        const prenomDetenteur = cleanValue(body.prenomDetenteur, 100);
        const nomDetenteur = cleanValue(body.nomDetenteur, 100);

        const numeroClient = cleanValue(body.numeroClient, 100);

        const demande = cleanValue(body.demande, 30);

        const commentaires = cleanValue(body.commentaires, 3000);

        // =========================
        // VALIDATION OBLIGATOIRE
        // =========================

        if (
            !nom ||
            !prenom ||
            !adresse ||
            !telephone ||
            !courriel ||
            !demande
        ) {
            throw new Error('Informations obligatoires manquantes.');
        }

        if (!isValidEmail(courriel)) {
            throw new Error('Adresse courriel invalide.');
        }

        if (!['credit', 'remboursement'].includes(demande)) {
            throw new Error('Type de demande invalide.');
        }

        // =========================
        // VALIDATION PRODUITS
        // =========================

        let produitsSelectionnes = [];

        if (Array.isArray(body.produits)) {
            produitsSelectionnes = body.produits
                .filter(item => typeof item === 'string')
                .map(item => cleanValue(item, 100))
                .filter(Boolean);

        } else if (typeof body.produits === 'string') {
            produitsSelectionnes = body.produits
                .split(',')
                .map(item => cleanValue(item, 100))
                .filter(Boolean);
        }

        if (
            produitsSelectionnes.length === 0 ||
            produitsSelectionnes.length > 20
        ) {
            throw new Error('Sélection de produits invalide.');
        }

        // =========================
        // VALIDATION FICHIER
        // =========================

        if (!req.file) {
            throw new Error('Preuve médicale manquante.');
        }

        if (!validateFileSignature(req.file)) {
            throw new Error('Contenu du fichier invalide.');
        }

        const filename = sanitizeFilename(req.file.originalname);

        // =========================
        // PRÉPARATION HTML SÉCURISÉ
        // =========================

        const nomHtml = escapeHtml(nom);
        const prenomHtml = escapeHtml(prenom);
        const adresseHtml = escapeHtml(adresse);

        const telephoneHtml = escapeHtml(telephone);
        const telephoneCellulaireHtml =
            escapeHtml(telephoneCellulaire || 'Non précisé');

        const telephoneBureauHtml =
            escapeHtml(telephoneBureau || 'Non précisé');

        const courrielHtml = escapeHtml(courriel);

        const prenomDetenteurHtml =
            escapeHtml(prenomDetenteur || 'Non précisé');

        const nomDetenteurHtml =
            escapeHtml(nomDetenteur || 'Non précisé');

        const numeroClientHtml =
            escapeHtml(numeroClient || 'Non précisé');

        const produitsHtml = escapeHtml(produitsSelectionnes.join(', '));

        const commentairesHtml =
            escapeHtml(commentaires || 'Aucun commentaire')
                .replace(/\n/g, '<br>');

        const filenameHtml = escapeHtml(filename);

        const typeDemande =
            demande === 'credit' ? 'Crédit' : 'Remboursement';

        const typeDemandeHtml = escapeHtml(typeDemande);

        // =========================
        // COURRIEL À VALLÉE DU PARC
        // =========================

        await transporter.sendMail({

            from: `"Site Vallée du Parc" <${process.env.SMTP_USER}>`,

            to: process.env.FORM_RECEIVER_CREDIT_MALADIE,

            replyTo: courriel,

            subject: `Nouvelle demande de crédit maladie - ${prenom} ${nom}`,

            attachments: [
                {
                    filename,
                    content: req.file.buffer,
                    contentType: allowedFiles[
                        path.extname(filename).toLowerCase()
                    ]
                }
            ],

            html: `
                <h2>Nouvelle demande de crédit / remboursement maladie</h2>

                <hr>

                <h3>Informations du client payeur</h3>

                <p><strong>Prénom :</strong> ${prenomHtml}</p>
                <p><strong>Nom :</strong> ${nomHtml}</p>
                <p><strong>Adresse :</strong> ${adresseHtml}</p>

                <hr>

                <h3>Coordonnées</h3>

                <p><strong>Téléphone principal :</strong> ${telephoneHtml}</p>
                <p><strong>Téléphone cellulaire :</strong> ${telephoneCellulaireHtml}</p>
                <p><strong>Téléphone bureau :</strong> ${telephoneBureauHtml}</p>
                <p><strong>Courriel :</strong> ${courrielHtml}</p>

                <hr>

                <h3>Détenteur de l'abonnement</h3>

                <p><strong>Prénom :</strong> ${prenomDetenteurHtml}</p>
                <p><strong>Nom :</strong> ${nomDetenteurHtml}</p>

                <hr>

                <h3>Informations supplémentaires</h3>

                <p><strong>Numéro de client ou facture :</strong> ${numeroClientHtml}</p>
                <p><strong>Produits :</strong> ${produitsHtml}</p>
                <p><strong>Type de demande :</strong> ${typeDemandeHtml}</p>

                <hr>

                <h3>Commentaires</h3>

                <p>${commentairesHtml}</p>

                <hr>

                <h3>Preuve médicale</h3>

                <p>
                    Le document suivant est joint à ce courriel :
                    <strong>${filenameHtml}</strong>
                </p>
            `,

            text: `
Nouvelle demande de crédit / remboursement maladie

Client payeur :
Prénom : ${prenom}
Nom : ${nom}
Adresse : ${adresse}

Coordonnées :
Téléphone : ${telephone}
Téléphone cellulaire : ${telephoneCellulaire || 'Non précisé'}
Téléphone bureau : ${telephoneBureau || 'Non précisé'}
Courriel : ${courriel}

Détenteur de l'abonnement :
Prénom : ${prenomDetenteur || 'Non précisé'}
Nom : ${nomDetenteur || 'Non précisé'}

Informations supplémentaires :
Numéro client : ${numeroClient || 'Non précisé'}
Produits : ${produitsSelectionnes.join(', ')}
Type de demande : ${typeDemande}

Commentaires :
${commentaires || 'Aucun commentaire'}

Preuve médicale jointe : ${filename}
            `
        });

        // =========================
        // CONFIRMATION AU CLIENT
        // =========================

        await transporter.sendMail({

            from: `"Vallée du Parc" <${process.env.SMTP_USER}>`,

            to: courriel,

            subject: 'Confirmation de réception de votre demande',

            html: `
                <h2>Bonjour ${prenomHtml},</h2>

                <p>
                    Nous avons bien reçu votre demande de
                    ${typeDemandeHtml.toLowerCase()}.
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

                <p>Merci,</p>

                <p>
                    <strong>L'équipe de Vallée du Parc</strong>
                </p>
            `,

            text: `
Bonjour ${prenom},

Nous avons bien reçu votre demande de ${typeDemande.toLowerCase()}.

Notre équipe analysera votre demande ainsi que les documents fournis.

Veuillez noter qu'un délai pouvant aller jusqu'à 3 semaines peut être nécessaire pour le traitement de votre demande.

Merci,

L'équipe de Vallée du Parc
            `
        });

        // =========================
        // REDIRECTION SUCCÈS
        // =========================

        return res.redirect('/faq?credit-success=1');

    } catch (error) {

        // Ne jamais enregistrer les renseignements personnels
        console.error(
            'Erreur formulaire crédit maladie :',
            error.message
        );

        return res.redirect('/faq?credit-error=1');
    }

});

module.exports = router;
