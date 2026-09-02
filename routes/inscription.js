const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const SchoolCourse = require('../models/SchoolCourse');
const SchoolSettings = require('../models/SchoolSettings');

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


/* =========================
   PROTECTION HTML
========================= */

function escapeHtml(value) {

    return String(value || '')

        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

}


/* =========================
   URL DE RETOUR SÉCURISÉE
========================= */

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


/* =========================
   RÉCUPÉRER ÉTAT PRÉVENTE
========================= */

async function getPresaleStatus() {

    const settings =
        await SchoolSettings.findOne();

    return settings?.presaleActive || false;

}


/* =========================
   AFFICHER LE BON PRIX
========================= */

function displayPrice(course, preventeActive) {

    /*
    =========================
    TEXTE SPÉCIAL
    =========================
    */

    if (course.priceLabel) {

        return course.priceLabel;

    }


    /*
    =========================
    PRIX PRÉVENTE
    =========================
    */

    if (

        preventeActive === true &&

        course.presalePrice !== null &&
        course.presalePrice !== undefined

    ) {

        return `${Number(
            course.presalePrice
        ).toFixed(2)} $`;

    }


    /*
    =========================
    PRIX RÉGULIER
    =========================
    */

    if (

        course.regularPrice !== null &&
        course.regularPrice !== undefined

    ) {

        return `${Number(
            course.regularPrice
        ).toFixed(2)} $`;

    }


    return 'À confirmer';

}


/* =========================================================
   INSCRIPTION COURS DE GROUPE
========================================================= */


/* =========================
   AFFICHER FORMULAIRE
========================= */

router.get('/', (req, res) => {

    res.render(
        'ecole/inscription',
        {

            title:
                'Inscription aux cours',

            returnUrl:
                req.query.returnUrl || '/'

        }
    );

});


/* =========================
   ENVOYER FORMULAIRE
========================= */

router.post('/', async (req, res) => {

    const redirectUrl =
        safeReturnUrl(

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


        /*
        =========================
        VALIDATION
        =========================
        */

        if (

            !eleveNom ||
            !eleveNaissance ||
            !parentNom ||
            !telephone ||
            !email

        ) {

            return res.redirect(

                `/inscription?returnUrl=${encodeURIComponent(
                    redirectUrl
                )}&error=fields`

            );

        }


        /*
        =========================
        TRANSPORTEUR EMAIL
        =========================
        */

        const transporter =
            createTransporter();


        /*
        =========================
        ENVOI EMAIL
        =========================
        */

        await transporter.sendMail({

            from:
                `"Formulaire Vallée du Parc" <${process.env.SMTP_USER}>`,

            to:
                process.env.FORM_RECEIVER_COURS,

            replyTo:
                email,

            subject:
                'Nouvelle inscription à un cours de groupe',


            html: `

                <h2>
                    Nouvelle inscription à un cours de groupe
                </h2>

                <hr>


                <h3>
                    Informations de l’élève
                </h3>


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

                    ${escapeHtml(
                        eleveNiveau || 'Non précisé'
                    )}

                </p>


                <hr>


                <h3>
                    Coordonnées du parent
                </h3>


                <p>

                    <strong>Nom :</strong>

                    ${escapeHtml(parentNom)}

                </p>


                <p>

                    <strong>Date de naissance :</strong>

                    ${escapeHtml(
                        parentNaissance || 'Non précisée'
                    )}

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


                <h3>
                    Préférences horaires
                </h3>


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


                <h3>
                    Commentaires
                </h3>


                <p>

                    ${escapeHtml(
                        commentaires || 'Aucun commentaire'
                    )}

                </p>

            `

        });


        /*
        =========================
        SUCCÈS
        =========================
        */

        return res.redirect(
            `${redirectUrl}?success=1`
        );


    } catch (error) {

        console.error(

            'Erreur inscription cours de groupe :',

            error

        );


        return res.redirect(
            `${redirectUrl}?error=mail`
        );

    }

});


/* =========================================================
   FORMULAIRE COURS PRIVÉ
========================================================= */


/* =========================
   AFFICHER FORMULAIRE
========================= */

router.get('/prive', async (req, res) => {

    try {

        const {

            courseId

        } = req.query;


        /*
        =========================
        VALIDATION ID
        =========================
        */

        if (

            !courseId ||

            !mongoose.Types.ObjectId.isValid(
                courseId
            )

        ) {

            return res.redirect(
                '/cours-prive?error=course'
            );

        }


        /*
        =========================
        RÉCUPÉRER LE COURS
        =========================
        */

        const course =
            await SchoolCourse.findOne({

                _id:
                    courseId,

                type:
                    'prive',

                isActive:
                    true

            });


        /*
        =========================
        COURS INTROUVABLE
        =========================
        */

        if (!course) {

            return res.redirect(
                '/cours-prive?error=course'
            );

        }


        /*
        =========================
        ÉTAT PRÉVENTE
        =========================
        */

        const preventeActive =
            await getPresaleStatus();


        /*
        =========================
        AFFICHER FORMULAIRE
        =========================
        */

        return res.render(
            'ecole/inscription-prive',
            {

                title:
                    `Inscription — ${course.title}`,

                course,

                preventeActive,

                returnUrl:
                    safeReturnUrl(

                        req.query.returnUrl,

                        '/cours-prive'

                    )

            }
        );


    } catch (error) {

        console.error(

            'Erreur chargement formulaire cours privé :',

            error

        );


        return res.redirect(
            '/cours-prive?error=form'
        );

    }

});


/* =========================================================
   ENVOI COURS PRIVÉ
========================================================= */

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


    /*
    =========================
    URL RETOUR
    =========================
    */

    const redirectUrl =
        safeReturnUrl(

            returnUrl,

            '/cours-prive'

        );


    try {


        /*
        =========================
        VALIDATION COURSE ID
        =========================
        */

        if (

            !courseId ||

            !mongoose.Types.ObjectId.isValid(
                courseId
            )

        ) {

            return res.redirect(
                '/cours-prive?error=course'
            );

        }


        /*
        =========================
        VALIDATION FORMULAIRE
        =========================
        */

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

                `&returnUrl=${encodeURIComponent(
                    redirectUrl
                )}` +

                `&error=fields`

            );

        }


        /*
        =========================
        RÉCUPÉRER LE COURS
        =========================
        */

        const course =
            await SchoolCourse.findOne({

                _id:
                    courseId,

                type:
                    'prive',

                isActive:
                    true

            });


        /*
        =========================
        COURS INTROUVABLE
        =========================
        */

        if (!course) {

            return res.redirect(
                '/cours-prive?error=course'
            );

        }


        /*
        =========================
        RÉCUPÉRER ÉTAT PRÉVENTE
        =========================
        */

        const preventeActive =
            await getPresaleStatus();


        /*
        =========================
        CALCUL DU PRIX UTILISÉ
        =========================
        */

        const prixAffiche =
            displayPrice(

                course,

                preventeActive

            );


        /*
        =========================
        TRANSPORTEUR
        =========================
        */

        const transporter =
            createTransporter();


        /*
        =========================
        ENVOI EMAIL
        =========================
        */

        await transporter.sendMail({

            from:
                `"Formulaire Vallée du Parc" <${process.env.SMTP_USER}>`,

            to:
                process.env.FORM_RECEIVER_COURS,

            replyTo:
                email,

            subject:
                `Demande de cours privé — ${course.title}`,


            html: `

                <h2>
                    Nouvelle demande de cours privé
                </h2>

                <hr>


                <h3>
                    Cours sélectionné
                </h3>


                <p>

                    <strong>Cours :</strong>

                    ${escapeHtml(course.title)}

                </p>


                <p>

                    <strong>Catégorie :</strong>

                    ${escapeHtml(
                        course.category || 'Cours privé'
                    )}

                </p>


                <p>

                    <strong>Durée :</strong>

                    ${escapeHtml(
                        course.duration || 'À confirmer'
                    )}

                </p>


                <p>

                    <strong>Période :</strong>

                    ${
                        preventeActive
                            ? 'Pré-vente'
                            : 'Régulier'
                    }

                </p>


                <p>

                    <strong>Prix :</strong>

                    ${escapeHtml(prixAffiche)}

                </p>


                <hr>


                <h3>
                    Informations de l’élève
                </h3>


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


                <h3>
                    Coordonnées du responsable
                </h3>


                <p>

                    <strong>Nom :</strong>

                    ${escapeHtml(parentNom)}

                </p>


                <p>

                    <strong>Date de naissance :</strong>

                    ${escapeHtml(
                        parentNaissance || 'Non précisée'
                    )}

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


                <h3>
                    Date et heure souhaitées
                </h3>


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


                <h3>
                    Commentaires
                </h3>


                <p>

                    ${escapeHtml(
                        commentaires || 'Aucun commentaire'
                    )}

                </p>

            `

        });


        /*
        =========================
        SUCCÈS
        =========================
        */

        return res.redirect(

            `${redirectUrl}?success=private-course`

        );


    } catch (error) {

        console.error(

            'Erreur envoi inscription cours privé :',

            error

        );


        return res.redirect(

            `/inscription/prive?courseId=${encodeURIComponent(
                courseId || ''
            )}` +

            `&returnUrl=${encodeURIComponent(
                redirectUrl
            )}` +

            `&error=mail`

        );

    }

});


module.exports = router;