const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const cloudinary = require('../config/cloudinary');

const Admin = require('../models/Admin');
const Event = require('../models/Event');
const Job = require('../models/Job');
const Trail = require('../models/trail');

const SubscriptionPrice = require('../models/SubscriptionPrice');
const DailyTicketPrice = require('../models/DailyTicketPrice');
const SchoolCourse = require('../models/SchoolCourse');
const RentalItem = require('../models/RentalItem');

const {
    requireLogin,
    requireRole,
    canAccess
} = require('../middleware/adminAuth');

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Trop de tentatives. Réessayez plus tard.'
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
            canAccess(role, ['carriere'])

    });

});


/* =========================================================
   ÉVÉNEMENTS
========================================================= */


/*
   Page des événements
*/

router.get(
    '/events',
    requireRole('evenement'),
    async (req, res) => {

        try {

            const events =
                await Event.find({})
                    .sort({ createdAt: -1 });


            res.render('admin/events', {

                title: 'Gestion des événements',

                events

            });


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

            const {
                title,
                description,
                dates,
                location
            } = req.body;

            let imageUrl = null;

            const eventDates = Array.isArray(dates)
                ? dates
                : [dates];

            const validDates = eventDates
                .filter(date => date && date.trim() !== '')
                .map(date => new Date(date));


            if (validDates.length === 0) {

                return res.status(400).send(
                    'Veuillez sélectionner au moins une date.'
                );

            }


            if (req.file) {

                const result =
                    await cloudinary.uploader.upload(
                        req.file.path,
                        {
                            folder: 'valleeduparc/events'
                        }
                    );

                imageUrl = result.secure_url;

            }

            /*
                Création de l'événement
            */

            await Event.create({

                title,

                description,

                dates: validDates,

                location,

                image: imageUrl

            });

            res.redirect('/admin-vdp/events');

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
   Suppression événement
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
                '/admin-vdp/prices/abonnements'
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


router.post(
    '/prices/billets/:id',
    requireRole('prix'),
    async (req, res) => {

        try {

            const onlinePrice =
                req.body.onlinePrice === ''
                    ? null
                    : Number(req.body.onlinePrice);


            const counterPrice =
                req.body.counterPrice === ''
                    ? null
                    : Number(req.body.counterPrice);


            await DailyTicketPrice.findByIdAndUpdate(

                req.params.id,

                {

                    onlinePrice,

                    counterPrice,

                    isFree:
                        req.body.isFree === 'on',

                    isActive:
                        req.body.isActive === 'on'

                }

            );


            res.redirect(
                '/admin-vdp/prices/billets'
            );


        } catch (error) {

            console.error(
                'Erreur modification billet :',
                error
            );

            res.status(500).send(
                'Erreur lors de la modification du billet.'
            );

        }

    }
);


/* =========================================================
   PRIX - COURS
========================================================= */


router.get(
    '/prices/cours',
    requireRole('prix'),
    async (req, res) => {

        try {

            const courses =
                await SchoolCourse.find({})
                    .sort({
                        season: 1,
                        order: 1
                    });


            res.render(
                'admin/price-courses',
                {

                    title: 'Prix cours',

                    courses

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


router.post(
    '/prices/cours/:id',
    requireRole('prix'),
    async (req, res) => {

        try {

            const price =
                req.body.price === ''
                    ? null
                    : Number(req.body.price);


            await SchoolCourse.findByIdAndUpdate(

                req.params.id,

                {

                    price,

                    priceLabel:
                        req.body.priceLabel || '',

                    isActive:
                        req.body.isActive === 'on'

                }

            );


            res.redirect(
                '/admin-vdp/prices/cours'
            );


        } catch (error) {

            console.error(
                'Erreur modification cours :',
                error
            );

            res.status(500).send(
                'Erreur lors de la modification du cours.'
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
   EXPORT
========================================================= */

module.exports = router;