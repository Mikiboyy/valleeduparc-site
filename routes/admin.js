const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const cloudinary = require('../config/cloudinary');

const Admin = require('../models/Admin');
const Event = require('../models/Event');
const Job = require('../models/Job');
const Trail = require('../models/trail');
const FAQ = require('../models/Faq');

const SubscriptionPrice = require('../models/SubscriptionPrice');
const DailyTicketPrice = require('../models/DailyTicketPrice');
const SchoolCourse = require('../models/SchoolCourse');
const SchoolSettings = require('../models/SchoolSettings');
const RentalItem = require('../models/RentalItem');

const {
    requireLogin,
    requireRole,
    canAccess
} = require('../middleware/adminAuth');

/* =========================
   PROTECTION LOGIN ADMIN
   ANTI BRUTE-FORCE
========================= */

const loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    limit: 5,

    standardHeaders: 'draft-8',

    legacyHeaders: false,

    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'

});


/* =========================================================
   MULTER + CLOUDINARY
========================================================= */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(
            null,
            uniqueName + path.extname(file.originalname)
        );
    }
});

const upload = multer({
    storage
});


/* =========================================================
   CONNEXION
========================================================= */

router.get('/login', (req, res) => {

    res.render('admin/login', {

        title: 'Connexion admin',

        layout: 'layout',

        error: req.query.error

    });

});


router.post('/login', loginLimiter, async (req, res) => {

    try {

        const { username, password } = req.body;

        /* Vérification des champs */

        if (!username || !password) {

            return res.redirect(
                '/admin-vdp/login?error=1'
            );

        }

        /* Recherche de l'utilisateur */

        const admin = await Admin.findOne({
            username: username.trim()
        });

        if (!admin) {

            console.log(
                'Utilisateur inexistant :',
                username
            );

            return res.redirect(
                '/admin-vdp/login?error=1'
            );

        }

        /* Vérification du compte */

        if (admin.isActive === false) {

            return res.redirect(
                '/admin-vdp/login?error=1'
            );

        }

        /* Vérification du mot de passe */

        const validPassword =
            await admin.comparePassword(password);

        if (!validPassword) {

            return res.redirect(
                '/admin-vdp/login?error=1'
            );

        }

        /* Création de la session */

        req.session.admin = {

            id: admin._id.toString(),

            username: admin.username,

            role: admin.role

        };

        res.redirect('/admin-vdp');

    } catch (error) {

        console.error(
            'ERREUR LOGIN ADMIN :',
            error
        );

        res.redirect(
            '/admin-vdp/login?error=1'
        );

    }

});


/* =========================================================
   DÉCONNEXION
========================================================= */

/*
   IMPORTANT :
   Il ne doit avoir qu'une seule route /logout.
*/

router.get('/logout', (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            console.error(
                'Erreur déconnexion :',
                error
            );

            return res.redirect(
                '/admin-vdp'
            );

        }

        res.redirect('/');

    });

});


/* =========================================================
   DASHBOARD
========================================================= */

router.get('/', requireLogin, (req, res) => {

    const role = req.session.admin.role;


    res.render('admin/dashboard', {

        title: 'Administration',

        adminUser: req.session.admin,


        /*
         * ADMIN
         * Peut accéder à tout.
         */

        canEvents:
            canAccess(role, ['evenement']),


        canPrices:
            canAccess(role, ['prix']),


        canTrails:
            canAccess(role, ['patrouille']),


        canJobs:
            canAccess(role, ['carriere']),

        
        canFAQ:
            canAccess(role, ['admin'])    

    });

});


/* =========================================================
   ÉVÉNEMENTS
========================================================= */


/*
   Page des événements - Admin
*/

router.get(
    '/events',
    requireRole('evenement'),
    async (req, res) => {

        try {

            const events = await Event.find({})
                .sort({
                    createdAt: -1
                });


            res.render(
                'admin/events',
                {

                    title: 'Gestion des événements',

                    events

                }
            );


        } catch (error) {

            console.error(
                'Erreur récupération événements :',
                error
            );


            res.status(500).send(
                'Erreur lors du chargement des événements.'
            );

        }

    }
);


/*
   Création d'un événement
*/

router.post(
    '/events',
    requireRole('evenement'),
    upload.single('image'),
    async (req, res) => {

        try {

            /*
                RÉCUPÉRATION DES DATES

                Si une seule date est sélectionnée,
                req.body.dates peut être une string.

                Si plusieurs dates sont sélectionnées,
                req.body.dates sera un tableau.
            */

            let dates = req.body.dates;


            /*
                Toujours transformer en tableau
            */

            if (!Array.isArray(dates)) {

                dates = [dates];

            }


            /*
                SUPPRIMER LES DATES VIDES
            */

            dates = dates.filter(date => {

                return (
                    date &&
                    typeof date === 'string' &&
                    date.trim() !== ''
                );

            });


            /*
                VÉRIFIER QU'IL Y A AU MOINS UNE DATE
            */

            if (dates.length === 0) {

                return res.status(400).send(
                    'Veuillez sélectionner au moins une date.'
                );

            }


            /*
                CONVERSION DES DATES

                On ajoute T00:00:00 pour éviter
                les problèmes de décalage de fuseau horaire.
            */

            const formattedDates = dates
                .map(date => {

                    return new Date(
                        `${date}T00:00:00`
                    );

                })
                .filter(date => {

                    return !isNaN(
                        date.getTime()
                    );

                });


            /*
                VÉRIFIER QUE LES DATES SONT VALIDES
            */

            if (formattedDates.length === 0) {

                return res.status(400).send(
                    'Les dates sélectionnées sont invalides.'
                );

            }


            /*
                SUPPRIMER LES DOUBLONS
            */

            const uniqueDates = [

                ...new Map(

                    formattedDates.map(date => [

                        date.getTime(),

                        date

                    ])

                ).values()

            ];


            /*
                TRIER LES DATES
            */

            uniqueDates.sort(
                (a, b) => a - b
            );


            /*
                IMAGE CLOUDINARY
            */

            let imageUrl = '';


            if (req.file) {

                const result = await cloudinary.uploader.upload(

                    req.file.path,

                    {

                        folder:
                            'valleeduparc/events'

                    }

                );


                imageUrl =
                    result.secure_url;

            }


            /*
                CRÉATION DE L'ÉVÉNEMENT
            */

            await Event.create({

                title:
                    req.body.title,

                description:
                    req.body.description,

                dates:
                    uniqueDates,

                location:
                    req.body.location || '',

                image:
                    imageUrl

            });


            /*
                RETOUR À L'ADMIN
            */

            res.redirect(
                '/admin-vdp/events'
            );


        } catch (error) {

            console.error(
                'Erreur création événement :',
                error
            );


            res.status(500).send(
                'Erreur lors de la création de l’événement.'
            );

        }

    }
);


/*
   Suppression d'un événement
*/

router.post(
    '/events/:id/delete',
    requireRole('evenement'),
    async (req, res) => {

        try {

            await Event.findByIdAndDelete(
                req.params.id
            );


            res.redirect(
                '/admin-vdp/events'
            );


        } catch (error) {

            console.error(
                'Erreur suppression événement :',
                error
            );


            res.status(500).send(
                'Erreur lors de la suppression.'
            );

        }

    }
);


/* =========================================================
   PRIX
========================================================= */


/*
   Menu principal des prix
*/

router.get(
    '/prices',
    requireRole('prix'),
    (req, res) => {

        res.render('admin/prices', {

            title: 'Gestion des prix'

        });

    }
);


/* =========================================================
   PRIX - ABONNEMENTS
========================================================= */


router.get(
    '/prices/abonnements',
    requireRole('prix'),
    async (req, res) => {

        try {

            const prices =
                await SubscriptionPrice.find({})
                    .sort({
                        category: 1,
                        order: 1
                    });


            res.render(
                'admin/price-subscriptions',
                {

                    title: 'Prix abonnements',

                    prices

                }
            );


        } catch (error) {

            console.error(
                'Erreur prix abonnements :',
                error
            );

            res.status(500).send(
                'Erreur lors du chargement des abonnements.'
            );

        }

    }
);


router.post(
    '/prices/abonnements/:id',
    requireRole('prix'),
    async (req, res) => {

        try {

            const regularPrice =
                req.body.regularPrice === ''
                    ? null
                    : Number(req.body.regularPrice);


            const fdcPrice =
                req.body.fdcPrice === ''
                    ? null
                    : Number(req.body.fdcPrice);


            await SubscriptionPrice.findByIdAndUpdate(

                req.params.id,

                {

                    regularPrice,

                    fdcPrice,

                    isActive:
                        req.body.isActive === 'on'

                }

            );


            res.redirect(
                '/admin-vdp/price-subscriptions'
            );


        } catch (error) {

            console.error(
                'Erreur modification abonnement :',
                error
            );

            res.status(500).send(
                'Erreur lors de la modification du prix.'
            );

        }

    }
);


/* =========================================================
   PRIX - BILLETS
========================================================= */


router.get(
    '/prices/billets',
    requireRole('prix'),
    async (req, res) => {

        try {

            const prices =
                await DailyTicketPrice.find({})
                    .sort({

                        categoryOrder: 1,

                        ticketOrder: 1,

                        ageOrder: 1

                    });


            res.render(
                'admin/price-tickets',
                {

                    title: 'Prix billets',

                    prices

                }
            );


        } catch (error) {

            console.error(
                'Erreur prix billets :',
                error
            );

            res.status(500).send(
                'Erreur lors du chargement des billets.'
            );

        }

    }
);


/* =========================================================
   PRIX - COURS
========================================================= */

router.post(
    '/prices/cours/add',

    requireRole('prix'),

    async (req, res) => {

        try {

            await SchoolCourse.create({

                type: req.body.type,

                season:
                    req.body.season || 'regulier',

                title:
                    req.body.title,

                category:
                    req.body.category || '',

                summary:
                    req.body.summary || '',

                description:
                    req.body.description || '',

                details:
                    req.body.details || '',

                duration:
                    req.body.duration || '',

                lessonDuration:
                    req.body.lessonDuration || '',

                schedule:
                    req.body.schedule || '',

                notes:
                    req.body.notes
                        ? req.body.notes
                            .split('\n')
                            .map(note => note.trim())
                            .filter(note => note !== '')
                        : [],


                prices: {

                    regularPrice:
                        req.body.regularPrice !== ''
                            ? Number(req.body.regularPrice)
                            : null,

                    presalePrice:
                        req.body.presalePrice !== ''
                            ? Number(req.body.presalePrice)
                            : null

                },


                priceLabel:
                    req.body.priceLabel || '',

                presalePriceLabel:
                    req.body.presalePriceLabel || '',


                order:
                    req.body.order !== ''
                        ? Number(req.body.order)
                        : 0,


                isActive:
                    req.body.isActive === 'on'

            });


            res.redirect(
                '/admin-vdp/prices-courses'
            );

        } catch (error) {

            console.error(
                'Erreur ajout cours :',
                error
            );

            res.redirect(
                '/admin-vdp/prices-courses?error=add'
            );

        }

    }
);

router.get(
    '/prices/cours',
    requireRole('prix'),
    async (req, res) => {

        try {

            const courses =
                await SchoolCourse.find({})
                    .sort({
                        type: 1,
                        order: 1
                    });


            let settings =
                await SchoolSettings.findOne();


            if (!settings) {

                settings =
                    await SchoolSettings.create({
                        preventeActive: false
                    });

            }


            res.render(
                'admin/price-courses',
                {

                    title: 'Prix cours',

                    courses,

                    preventeActive:
                        settings.preventeActive

                }
            );

        } catch (error) {

            console.error(
                'Erreur prix cours :',
                error
            );

            res.status(500).send(
                'Erreur lors du chargement des cours.'
            );

        }

    }
);


/* =========================================================
   MODIFICATION D'UN COURS
========================================================= */

router.post(
    '/prices/cours/:id',

    requireRole('prix'),

    async (req, res) => {

        try {

            await SchoolCourse.findByIdAndUpdate(

                req.params.id,

                {
                    $set: {

                        // =========================
                        // INFORMATIONS
                        // =========================

                        type:
                            req.body.type,

                        season:
                            req.body.season || 'regulier',

                        title:
                            req.body.title,

                        category:
                            req.body.category || '',

                        summary:
                            req.body.summary || '',

                        description:
                            req.body.description || '',

                        details:
                            req.body.details || '',


                        // =========================
                        // DURÉES
                        // =========================

                        duration:
                            req.body.duration || '',

                        lessonDuration:
                            req.body.lessonDuration || '',

                        schedule:
                            req.body.schedule || '',


                        // =========================
                        // NOTES
                        // =========================

                        notes:
                            req.body.notes
                                ? req.body.notes
                                    .split('\n')
                                    .map(note => note.trim())
                                    .filter(note => note !== '')
                                : [],


                        // =========================
                        // PRIX
                        // =========================

                        'prices.regularPrice':
                            req.body.regularPrice !== ''
                                ? Number(req.body.regularPrice)
                                : null,

                        'prices.presalePrice':
                            req.body.presalePrice !== ''
                                ? Number(req.body.presalePrice)
                                : null,


                        // =========================
                        // LABELS
                        // =========================

                        priceLabel:
                            req.body.priceLabel || '',

                        presalePriceLabel:
                            req.body.presalePriceLabel || '',


                        // =========================
                        // ADMIN
                        // =========================

                        order:
                            req.body.order !== ''
                                ? Number(req.body.order)
                                : 0,

                        isActive:
                            req.body.isActive === 'on'

                    }

                }

            );


            res.redirect(
                '/admin-vdp/prices-courses'
            );

        } catch (error) {

            console.error(
                'Erreur modification cours :',
                error
            );

            res.redirect(
                '/admin-vdp/prices-courses?error=update'
            );

        }

    }
);

router.post(
    '/prices/cours/:id/delete',

    requireRole('prix'),

    async (req, res) => {

        try {

            await SchoolCourse.findByIdAndDelete(
                req.params.id
            );

            res.redirect(
                '/admin-vdp/prices-courses'
            );

        } catch (error) {

            console.error(
                'Erreur suppression cours :',
                error
            );

            res.redirect(
                '/admin-vdp/prices-courses?error=delete'
            );

        }

    }
);

/* =========================================================
   ACTIVER / DÉSACTIVER LA PRÉVENTE
========================================================= */

router.post(
    '/prices/toggle-presale',

    requireRole('prix'),

    async (req, res) => {

        try {

            let settings =
                await SchoolSettings.findOne();


            if (!settings) {

                settings =
                    await SchoolSettings.create({
                        preventeActive: false
                    });

            }


            settings.preventeActive =
                !settings.preventeActive;


            await settings.save();


            res.redirect(
                '/admin-vdp/prices-courses'
            );

        } catch (error) {

            console.error(
                'Erreur changement prévente :',
                error
            );

            res.status(500).send(
                'Erreur lors du changement de la prévente.'
            );

        }

    }
);

/* =========================================================
   PRIX - LOCATION
========================================================= */


router.get(
    '/prices/location',
    requireRole('prix'),
    async (req, res) => {

        try {

            const items =
                await RentalItem.find({})
                    .sort({
                        order: 1
                    });


            res.render(
                'admin/price-rentals',
                {

                    title: 'Prix location',

                    items

                }
            );


        } catch (error) {

            console.error(
                'Erreur prix location :',
                error
            );

            res.status(500).send(
                'Erreur lors du chargement des locations.'
            );

        }

    }
);


router.post(
    '/prices/location/:id',
    requireRole('prix'),
    async (req, res) => {

        try {

            const price =
                req.body.price === ''
                    ? null
                    : Number(req.body.price);


            await RentalItem.findByIdAndUpdate(

                req.params.id,

                {

                    price,

                    isActive:
                        req.body.isActive === 'on'

                }

            );


            res.redirect(
                '/admin-vdp/prices/location'
            );


        } catch (error) {

            console.error(
                'Erreur modification location :',
                error
            );

            res.status(500).send(
                'Erreur lors de la modification du prix.'
            );

        }

    }
);


/* =========================================================
   PATROUILLE / PISTES
========================================================= */


/*
   Affichage des pistes
*/

router.get(
    '/trails',
    requireRole('patrouille'),
    async (req, res) => {

        try {

            const trails =
                await Trail.find({})
                    .sort({
                        trailNumber: 1
                    });


            res.render(
                'admin/trails',
                {

                    title: 'Gestion des pistes',

                    trails

                }
            );


        } catch (error) {

            console.error(
                'Erreur récupération pistes :',
                error
            );

            res.status(500).send(
                'Erreur lors du chargement des pistes.'
            );

        }

    }
);


/*
   IMPORTANT :
   Un seul bouton "Enregistrer"
   sauvegarde toutes les pistes.
*/

router.post(
    '/trails/save',
    requireRole('patrouille'),
    async (req, res) => {

        try {

            const trails =
                await Trail.find({});


            for (const trail of trails) {

                /*
                 * Les valeurs viennent des
                 * select du formulaire.
                 */

                const dayValue =
                    req.body[`day_${trail._id}`];

                const nightValue =
                    req.body[`night_${trail._id}`];


                /*
                 * Si ton select utilise :
                 *
                 * <option value="true">
                 * <option value="false">
                 *
                 * cette conversion fonctionne.
                 */

                const openDay =
                    dayValue === 'true';


                const openNight =
                    nightValue === 'true';


                await Trail.findByIdAndUpdate(

                    trail._id,

                    {

                        openDay,

                        openNight

                    }

                );

            }


            console.log(
                'Toutes les conditions des pistes ont été enregistrées.'
            );


            res.redirect(
                '/admin-vdp/trails'
            );


        } catch (error) {

            console.error(
                'Erreur sauvegarde pistes :',
                error
            );


            res.status(500).send(
                'Erreur lors de la sauvegarde des pistes.'
            );

        }

    }
);


/* =========================================================
   CARRIÈRES
========================================================= */

/*
   Liste des postes
*/

router.get(
    '/jobs',
    requireRole('carriere'),
    async (req, res) => {

        try {

            const jobs = await Job.find({})
                .sort({
                    createdAt: -1
                });

            res.render(
                'admin/jobs',
                {
                    title: 'Gestion des postes',
                    jobs
                }
            );

        } catch (error) {

            console.error(
                'Erreur récupération postes :',
                error
            );

            res.status(500).send(
                'Erreur lors du chargement des postes.'
            );

        }

    }
);


/* =========================================================
   CRÉATION D'UN POSTE
========================================================= */

router.post(
    '/jobs',
    requireRole('carriere'),
    upload.single('image'),
    async (req, res) => {

        try {

            let imageUrl = null;

            /*
               Transformation des détails.

               Chaque ligne du textarea devient
               un élément dans le tableau details.
            */

            const detailsArray = req.body.details
                ? req.body.details
                    .split('\n')
                    .map(detail => detail.trim())
                    .filter(detail => detail.length > 0)
                : [];


            /*
               Si une image a été envoyée
            */

            if (req.file) {

                const result = await cloudinary.uploader.upload(
                    req.file.path,
                    {
                        folder: 'valleeduparc/jobs'
                    }
                );

                imageUrl = result.secure_url;

            }


            /*
               Création du poste
            */

            await Job.create({

                title: req.body.title,

                department: req.body.department,

                summary: req.body.summary,

                details: detailsArray,

                image: imageUrl,

                isActive: req.body.isActive === 'on'

            });


            res.redirect('/admin-vdp/jobs');


        } catch (error) {

            console.error(
                'Erreur création emploi :',
                error
            );

            res.status(500).send(
                'Erreur lors de la création de l’emploi.'
            );

        }

    }
);


/* =========================================================
   MODIFICATION D'UN POSTE
========================================================= */

router.post(
    '/jobs/:id',
    requireRole('carriere'),
    upload.single('image'),
    async (req, res) => {

        try {

            /*
               Transformation des détails.

               Un élément par ligne.
            */

            const detailsArray = req.body.details
                ? req.body.details
                    .split('\n')
                    .map(detail => detail.trim())
                    .filter(detail => detail.length > 0)
                : [];


            /*
               Données à modifier
            */

            const updateData = {

                title: req.body.title,

                department: req.body.department,

                summary: req.body.summary,

                details: detailsArray,

                isActive: req.body.isActive === 'on'

            };


            /*
               Si une nouvelle image est envoyée
            */

            if (req.file) {

                const result = await cloudinary.uploader.upload(
                    req.file.path,
                    {
                        folder: 'valleeduparc/jobs'
                    }
                );

                updateData.image = result.secure_url;

            }


            /*
               Mise à jour du poste
            */

            await Job.findByIdAndUpdate(

                req.params.id,

                updateData,

                {
                    new: true
                }

            );


            res.redirect(
                '/admin-vdp/jobs'
            );


        } catch (error) {

            console.error(
                'Erreur modification poste :',
                error
            );

            res.status(500).send(
                'Erreur lors de la modification du poste.'
            );

        }

    }
);


/* =========================================================
   SUPPRESSION D'UN POSTE
========================================================= */

router.post(
    '/jobs/:id/delete',
    requireRole('carriere'),
    async (req, res) => {

        try {

            await Job.findByIdAndDelete(
                req.params.id
            );


            res.redirect(
                '/admin-vdp/jobs'
            );


        } catch (error) {

            console.error(
                'Erreur suppression poste :',
                error
            );

            res.status(500).send(
                'Erreur lors de la suppression du poste.'
            );

        }

    }
);

/* =========================================================
   FAQ
========================================================= */

/* =========================
   LISTE DES QUESTIONS
========================= */

router.get(
    '/faq',
    requireRole('faq'),
    async (req, res) => {

        try {

            const faqs = await FAQ.find({})
                .sort({
                    category: 1,
                    order: 1
                });

            res.render(
                'admin/faq',
                {
                    title: 'Gestion du FAQ',
                    faqs
                }
            );

        } catch (error) {

            console.error(
                'Erreur récupération FAQ :',
                error
            );

            res.status(500).send(
                'Erreur lors du chargement du FAQ.'
            );

        }

    }
);


/* =========================
   AJOUTER UNE QUESTION
========================= */

router.post(
    '/faq',
    requireRole('faq'),
    async (req, res) => {

        try {

            await FAQ.create({

                category:
                    req.body.category,

                question:
                    req.body.question,

                answer:
                    req.body.answer,

                order:
                    Number(req.body.order) || 0,

                isActive:
                    req.body.isActive === 'on'

            });

            res.redirect(
                '/admin-vdp/faq'
            );

        } catch (error) {

            console.error(
                'Erreur ajout FAQ :',
                error
            );

            res.status(500).send(
                'Erreur lors de l’ajout de la question.'
            );

        }

    }
);


/* =========================
   MODIFIER UNE QUESTION
========================= */

router.post(
    '/faq/:id',
    requireRole('faq'),
    async (req, res) => {

        try {

            await FAQ.findByIdAndUpdate(

                req.params.id,

                {

                    category:
                        req.body.category,

                    question:
                        req.body.question,

                    answer:
                        req.body.answer,

                    order:
                        Number(req.body.order) || 0,

                    isActive:
                        req.body.isActive === 'on'

                },

                {
                    new: true
                }

            );

            res.redirect(
                '/admin-vdp/faq'
            );

        } catch (error) {

            console.error(
                'Erreur modification FAQ :',
                error
            );

            res.status(500).send(
                'Erreur lors de la modification.'
            );

        }

    }
);


/* =========================
   SUPPRIMER UNE QUESTION
========================= */

router.post(
    '/faq/:id/delete',
    requireRole('faq'),
    async (req, res) => {

        try {

            await FAQ.findByIdAndDelete(
                req.params.id
            );

            res.redirect(
                '/admin-vdp/faq'
            );

        } catch (error) {

            console.error(
                'Erreur suppression FAQ :',
                error
            );

            res.status(500).send(
                'Erreur lors de la suppression.'
            );

        }

    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;