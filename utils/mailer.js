const nodemailer = require('nodemailer');

/* =========================
   CONFIGURATION MAILERSEND
========================= */

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.mailersend.net';
const SMTP_PORT = Number(process.env.SMTP_PORT || 2525);

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,

    // Force STARTTLS lorsque la connexion n'utilise pas le port 465.
    requireTLS: SMTP_PORT !== 465,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000

    // Ne pas désactiver la validation des certificats TLS.
});

/* =========================
   EXPÉDITEUR PAR DÉFAUT
========================= */

function getDefaultFrom() {
    if (process.env.MAIL_FROM) {
        return process.env.MAIL_FROM;
    }

    if (process.env.SMTP_USER) {
        return `"Site Vallée du Parc" <${process.env.SMTP_USER}>`;
    }

    throw new Error('Variable SMTP_USER ou MAIL_FROM manquante.');
}

/* =========================
   ENVOI DES COURRIELS
========================= */

async function sendMail(options) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Configuration SMTP_USER ou SMTP_PASS manquante.');
    }

    if (!options || !options.to) {
        throw new Error('Destinataire du courriel manquant.');
    }

    return transporter.sendMail({
        ...options,
        from: options.from || getDefaultFrom()
    });
}

/* =========================
   EXPORTATION
========================= */

module.exports = {
    sendMail,
    transporter
};