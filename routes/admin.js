const express = require('express');
const router = express.Router();
const multer = require('multer');

const Admin = require('../models/Admin');
const Event = require('../models/Event');
const Job = require('../models/Job');
const Trail = require('../models/Trail');

const SubscriptionPrice = require('../models/SubscriptionPrice');
const DailyTicketPrice = require('../models/DailyTicketPrice');
const SchoolCourse = require('../models/SchoolCourse');
const RentalItem = require('../models/RentalItem');

const { requireLogin, requireRole, canAccess } = require('../middleware/adminAuth');

/* =========================
   MULTER
========================= */

const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

/* =========================
   AUTH
========================= */

router.get('/login', (req, res) => {
    res.render('admin/login', {
        title: 'Connexion admin',
        layout: 'layout',
        error: req.query.error
    });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await Admin.findOne({
            username,
            isActive: true
        });

        if (!admin) {
            return res.redirect('/admin-vdp/login?error=1');
        }

        const validPassword = await admin.comparePassword(password);

        if (!validPassword) {
            return res.redirect('/admin-vdp/login?error=1');
        }

        req.session.admin = {
            id: admin._id.toString(),
            username: admin.username,
            role: admin.role
        };

        res.redirect('/admin-vdp');

    } catch (error) {
        console.error(error);
        res.redirect('/admin-vdp/login?error=1');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin-vdp/login');
    });
});

/* =========================
   DASHBOARD
========================= */

router.get('/', requireLogin, (req, res) => {
    const role = req.session.admin.role;

    res.render('admin/dashboard', {
        title: 'Administration',
        adminUser: req.session.admin,
        canEvents: canAccess(role, ['evenement']),
        canPrices: canAccess(role, ['prix']),
        canTrails: canAccess(role, ['patrouille']),
        canJobs: canAccess(role, ['carriere'])
    });
});

router.get('/logout', (req, res) => {

    req.session.destroy(() => {

        res.redirect('/');

    });

});

/* =========================
   ÉVÉNEMENTS
========================= */

router.get('/events', requireRole('evenement'), async (req, res) => {
    const events = await Event.find({}).sort({ date: -1 });

    res.render('admin/events', {
        title: 'Gestion des événements',
        events
    });
});

router.post('/events', requireRole('evenement'), upload.single('image'), async (req, res) => {
    await Event.create({
        title: req.body.title,
        description: req.body.description,
        date: req.body.date,
        location: req.body.location,
        image: req.file ? req.file.filename : null
    });

    res.redirect('/admin-vdp/events');
});

router.post('/events/:id/delete', requireRole('evenement'), async (req, res) => {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect('/admin-vdp/events');
});

/* =========================
   PRIX
========================= */

router.get('/prices', requireRole('prix'), (req, res) => {
    res.render('admin/prices', {
        title: 'Gestion des prix'
    });
});

/* Abonnements */
router.get('/prices/abonnements', requireRole('prix'), async (req, res) => {
    const prices = await SubscriptionPrice.find({}).sort({ category: 1, order: 1 });

    res.render('admin/price-subscriptions', {
        title: 'Prix abonnements',
        prices
    });
});

router.post('/prices/abonnements/:id', requireRole('prix'), async (req, res) => {
    await SubscriptionPrice.findByIdAndUpdate(req.params.id, {
        regularPrice: req.body.regularPrice || null,
        fdcPrice: req.body.fdcPrice || null,
        isActive: req.body.isActive === 'on'
    });

    res.redirect('/admin-vdp/prices/abonnements');
});

/* Billets */
router.get('/prices/billets', requireRole('prix'), async (req, res) => {
    const prices = await DailyTicketPrice.find({}).sort({
        categoryOrder: 1,
        ticketOrder: 1,
        ageOrder: 1
    });

    res.render('admin/price-tickets', {
        title: 'Prix billets',
        prices
    });
});

router.post('/prices/billets/:id', requireRole('prix'), async (req, res) => {
    await DailyTicketPrice.findByIdAndUpdate(req.params.id, {
        onlinePrice: req.body.onlinePrice || null,
        counterPrice: req.body.counterPrice || null,
        isFree: req.body.isFree === 'on',
        isActive: req.body.isActive === 'on'
    });

    res.redirect('/admin-vdp/prices/billets');
});

/* Cours */
router.get('/prices/cours', requireRole('prix'), async (req, res) => {
    const courses = await SchoolCourse.find({}).sort({ season: 1, order: 1 });

    res.render('admin/price-courses', {
        title: 'Prix cours',
        courses
    });
});

router.post('/prices/cours/:id', requireRole('prix'), async (req, res) => {
    await SchoolCourse.findByIdAndUpdate(req.params.id, {
        price: req.body.price || null,
        priceLabel: req.body.priceLabel || '',
        isActive: req.body.isActive === 'on'
    });

    res.redirect('/admin-vdp/prices/cours');
});

/* Location */
router.get('/prices/location', requireRole('prix'), async (req, res) => {
    const items = await RentalItem.find({}).sort({ order: 1 });

    res.render('admin/price-rentals', {
        title: 'Prix location',
        items
    });
});

router.post('/prices/location/:id', requireRole('prix'), async (req, res) => {
    await RentalItem.findByIdAndUpdate(req.params.id, {
        price: req.body.price || null,
        isActive: req.body.isActive === 'on'
    });

    res.redirect('/admin-vdp/prices/location');
});

/* =========================
   PATROUILLE / PISTES
========================= */

router.get('/trails', requireRole('patrouille'), async (req, res) => {
    const trails = await Trail.find({}).sort({ trailNumber: 1 });

    res.render('admin/trails', {
        title: 'Gestion des pistes',
        trails
    });
});

router.post('/trails/save', requireRole('patrouille'), async (req, res) => {
    try {
        const trails = await Trail.find();

        for (const trail of trails) {
            await Trail.findByIdAndUpdate(trail._id, {
                openDay: req.body[`day_${trail._id}`] === 'true',
                openNight: req.body[`night_${trail._id}`] === 'true'
            });
        }

        res.redirect('/admin-vdp/trails');

    } catch (error) {
        console.error(error);
        res.redirect('/admin-vdp/trails');
    }
});

/* =========================
   CARRIÈRES
========================= */

router.get('/jobs', requireRole('carriere'), async (req, res) => {
    const jobs = await Job.find({}).sort({ createdAt: -1 });

    res.render('admin/jobs', {
        title: 'Gestion des postes',
        jobs
    });
});

router.post('/jobs', requireRole('carriere'), upload.single('image'), async (req, res) => {
    await Job.create({
        title: req.body.title,
        department: req.body.department,
        summary: req.body.summary,
        image: req.file ? req.file.filename : 'default-job.jpg',
        isActive: req.body.isActive === 'on'
    });

    res.redirect('/admin-vdp/jobs');
});

router.post('/jobs/:id', requireRole('carriere'), async (req, res) => {
    await Job.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        department: req.body.department,
        summary: req.body.summary,
        isActive: req.body.isActive === 'on'
    });

    res.redirect('/admin-vdp/jobs');
});

router.post('/jobs/:id/delete', requireRole('carriere'), async (req, res) => {
    await Job.findByIdAndDelete(req.params.id);
    res.redirect('/admin-vdp/jobs');
});

module.exports = router;