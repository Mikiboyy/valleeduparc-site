const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const SchoolCourse = require('../models/SchoolCourse');

const router = express.Router();

/* =========================
   OUTILS
========================= */

function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,

        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },

        tls: {
            rejectUnauthorized: false
        }
    });
}

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function safeReturnUrl(returnUrl, fallback) {
    if (
        typeof returnUrl === 'string' &&
        returnUrl.startsWith('/') &&
        !returnUrl.startsWith('//')
    ) {
        return returnUrl;
    }

    return fallback;
}

function displayPrice(course) {
    if (course.priceLabel) {
        return course.priceLabel;
    }

    if (course.price !== null && course.price !== undefined) {
        return `${course.price.toFixed(2)} $`;
    }

    return 'À confirmer';
}

/* =========================
   INSCRIPTION COURS DE GROUPE
========================= */

router.get('/', (req, res) => {
    res.render('ecole/inscription', {
        title: 'Inscription aux cours',
        returnUrl: req.query.returnUrl || '/'
    });
});

router.post('/', async (req, res) => {
    const redirectUrl = safeReturnUrl(
        req.body.returnUrl,
        '/inscription'
    );

    try {
        const {
            eleveNom,
            eleveNaissance,
            eleveNiveau,
            parentNom,
            parentNaissance,
            telephone,
            email,
            duree,
            horaire,
            commentaires
        } = req.body;

        if (
            !eleveNom ||
            !eleveNaissance ||
            !parentNom ||
            !telephone ||
            !email
        ) {
            return res.redirect(
                `/inscription?returnUrl=${encodeURIComponent(redirectUrl)}&error=fields`
            );
        }

        const transporter = createTransporter();

        await transporter.sendMail({
            from: `"Formulaire Vallée du Parc" <${process.env.SMTP_USER}>`,
            to: process.env.FORM_RECEIVER_COURS,
            replyTo: email,
            subject: 'Nouvelle inscription à un cours de groupe',

            html: `
                <h2>Nouvelle inscription à un cours de groupe</h2>

                <hr>

                <h3>Informations de l’élève</h3>

                <p>
                    <strong>Nom :</strong>
                    ${escapeHtml(eleveNom)}
                </p>

                <p>
                    <strong>Date de naissance :</strong>
                    ${escapeHtml(eleveNaissance)}
                </p>

                <p>
                    <strong>Niveau :</strong>
                    ${escapeHtml(eleveNiveau || 'Non précisé')}
                </p>

                <hr>

                <h3>Coordonnées du parent</h3>

                <p>
                    <strong>Nom :</strong>
                    ${escapeHtml(parentNom)}
                </p>

                <p>
                    <strong>Date de naissance :</strong>
                    ${escapeHtml(parentNaissance || 'Non précisée')}
                </p>

                <p>
                    <strong>Téléphone :</strong>
                    ${escapeHtml(telephone)}
                </p>

                <p>
                    <strong>Courriel :</strong>
                    ${escapeHtml(email)}
                </p>

                <hr>

                <h3>Préférences horaires</h3>

                <p>
                    <strong>Durée :</strong>
                    ${escapeHtml(
                        Array.isArray(duree)
                            ? duree.join(', ')
                            : duree || 'Non précisée'
                    )}
                </p>

                <p>
                    <strong>Horaire :</strong>
                    ${escapeHtml(
                        Array.isArray(horaire)
                            ? horaire.join(', ')
                            : horaire || 'Non précisé'
                    )}
                </p>

                <hr>

                <h3>Commentaires</h3>

                <p>
                    ${escapeHtml(commentaires || 'Aucun commentaire')}
                </p>
            `
        });

        return res.redirect(`${redirectUrl}?success=1`);

    } catch (error) {
        console.error(
            'Erreur inscription cours de groupe :',
            error
        );

        return res.redirect(`${redirectUrl}?error=mail`);
    }
});

/* =========================
   FORMULAIRE COURS PRIVÉ
========================= */

router.get('/prive', async (req, res) => {
    try {
        const { courseId } = req.query;

        if (
            !courseId ||
            !mongoose.Types.ObjectId.isValid(courseId)
        ) {
            return res.redirect('/cours-prive?error=course');
        }

        const course = await SchoolCourse.findOne({
            _id: courseId,
            type: 'prive',
            isActive: true
        });

        if (!course) {
            return res.redirect('/cours-prive?error=course');
        }

        return res.render('ecole/inscription-prive', {
            title: `Inscription — ${course.title}`,
            course,
            returnUrl: safeReturnUrl(
                req.query.returnUrl,
                '/cours-prive'
            )
        });

    } catch (error) {
        console.error(
            'Erreur chargement formulaire cours privé :',
            error
        );

        return res.redirect('/cours-prive?error=form');
    }
});

/* =========================
   ENVOI COURS PRIVÉ
========================= */

router.post('/prive', async (req, res) => {
    const {
        courseId,
        returnUrl,
        eleveNom,
        eleveNaissance,
        discipline,
        eleveNiveau,
        parentNom,
        parentNaissance,
        telephone,
        email,
        dateCours,
        heureCours,
        commentaires
    } = req.body;

    const redirectUrl = safeReturnUrl(
        returnUrl,
        '/cours-prive'
    );

    try {
        if (
            !courseId ||
            !mongoose.Types.ObjectId.isValid(courseId)
        ) {
            return res.redirect(
                '/cours-prive?error=course'
            );
        }

        if (
            !eleveNom ||
            !eleveNaissance ||
            !discipline ||
            !eleveNiveau ||
            !parentNom ||
            !telephone ||
            !email ||
            !dateCours ||
            !heureCours
        ) {
            return res.redirect(
                `/inscription/prive?courseId=${courseId}` +
                `&returnUrl=${encodeURIComponent(redirectUrl)}` +
                `&error=fields`
            );
        }

        const course = await SchoolCourse.findOne({
            _id: courseId,
            type: 'prive',
            isActive: true
        });

        if (!course) {
            return res.redirect(
                '/cours-prive?error=course'
            );
        }

        const transporter = createTransporter();

        await transporter.sendMail({
            from: `"Formulaire Vallée du Parc" <${process.env.SMTP_USER}>`,
            to: process.env.FORM_RECEIVER_COURS,
            replyTo: email,
            subject: `Demande de cours privé — ${course.title}`,

            html: `
                <h2>Nouvelle demande de cours privé</h2>

                <hr>

                <h3>Cours sélectionné</h3>

                <p>
                    <strong>Cours :</strong>
                    ${escapeHtml(course.title)}
                </p>

                <p>
                    <strong>Catégorie :</strong>
                    ${escapeHtml(course.category || 'Cours privé')}
                </p>

                <p>
                    <strong>Durée :</strong>
                    ${escapeHtml(course.duration || 'À confirmer')}
                </p>

                <p>
                    <strong>Période :</strong>
                    ${
                        course.season === 'prevente'
                            ? 'Pré-vente'
                            : 'Régulier'
                    }
                </p>

                <p>
                    <strong>Prix :</strong>
                    ${escapeHtml(displayPrice(course))}
                </p>

                <hr>

                <h3>Informations de l’élève</h3>

                <p>
                    <strong>Nom :</strong>
                    ${escapeHtml(eleveNom)}
                </p>

                <p>
                    <strong>Date de naissance :</strong>
                    ${escapeHtml(eleveNaissance)}
                </p>

                <p>
                    <strong>Discipline :</strong>
                    ${escapeHtml(discipline)}
                </p>

                <p>
                    <strong>Niveau :</strong>
                    ${escapeHtml(eleveNiveau)}
                </p>

                <hr>

                <h3>Coordonnées du responsable</h3>

                <p>
                    <strong>Nom :</strong>
                    ${escapeHtml(parentNom)}
                </p>

                <p>
                    <strong>Date de naissance :</strong>
                    ${escapeHtml(parentNaissance || 'Non précisée')}
                </p>

                <p>
                    <strong>Téléphone :</strong>
                    ${escapeHtml(telephone)}
                </p>

                <p>
                    <strong>Courriel :</strong>
                    ${escapeHtml(email)}
                </p>

                <hr>

                <h3>Date et heure souhaitées</h3>

                <p>
                    <strong>Date :</strong>
                    ${escapeHtml(dateCours)}
                </p>

                <p>
                    <strong>Heure :</strong>
                    ${escapeHtml(heureCours)}
                </p>

                <p>
                    La date et l’heure demandées doivent être
                    confirmées par la station.
                </p>

                <hr>

                <h3>Commentaires</h3>

                <p>
                    ${escapeHtml(commentaires || 'Aucun commentaire')}
                </p>
            `
        });

        return res.redirect(
            `${redirectUrl}?success=private-course`
        );

    } catch (error) {
        console.error(
            'Erreur envoi inscription cours privé :',
            error
        );

        return res.redirect(
            `/inscription/prive?courseId=${encodeURIComponent(courseId || '')}` +
            `&returnUrl=${encodeURIComponent(redirectUrl)}` +
            `&error=mail`
        );
    }
});

module.exports = router;