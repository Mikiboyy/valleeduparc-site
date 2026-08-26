const express = require('express');
const router = express.Router();

const Faq = require('../models/Faq');


/* =========================
   LISTE DES FAQ
========================= */

router.get('/', async (req, res) => {

    try {

        const faqs = await Faq.find()
            .sort({
                category: 1,
                order: 1
            })
            .lean();

        res.render(
            'admin-vdp/faq/index',
            {
                faqs
            }
        );

    } catch (error) {

        console.error(
            'Erreur chargement FAQ admin :',
            error
        );

        res.status(500).send(
            'Erreur lors du chargement des FAQ.'
        );

    }

});


/* =========================
   PAGE AJOUT
========================= */

router.get('/new', (req, res) => {

    res.render(
        'admin-vdp/faq/form',
        {
            faq: null
        }
    );

});


/* =========================
   AJOUTER FAQ
========================= */

router.post('/', async (req, res) => {

    try {

        await Faq.create({

            category: req.body.category,

            question: req.body.question,

            answer: req.body.answer,

            order: Number(req.body.order) || 0,

            isActive:
                req.body.isActive === 'true'

        });

        res.redirect(
            '/admin-vdp/faq'
        );

    } catch (error) {

        console.error(
            'Erreur création FAQ :',
            error
        );

        res.status(500).send(
            'Erreur lors de la création.'
        );

    }

});


/* =========================
   PAGE MODIFICATION
========================= */

router.get('/:id/edit', async (req, res) => {

    try {

        const faq = await Faq.findById(
            req.params.id
        ).lean();

        if (!faq) {

            return res.status(404).send(
                'FAQ introuvable.'
            );

        }

        res.render(
            'admin-vdp/faq/form',
            {
                faq
            }
        );

    } catch (error) {

        console.error(
            'Erreur modification FAQ :',
            error
        );

        res.status(500).send(
            'Erreur.'
        );

    }

});


/* =========================
   MODIFIER FAQ
========================= */

router.post('/:id', async (req, res) => {

    try {

        await Faq.findByIdAndUpdate(

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
                    req.body.isActive === 'true'

            }

        );

        res.redirect(
            '/admin-vdp/faq'
        );

    } catch (error) {

        console.error(
            'Erreur mise à jour FAQ :',
            error
        );

        res.status(500).send(
            'Erreur lors de la modification.'
        );

    }

});


/* =========================
   SUPPRIMER FAQ
========================= */

router.post('/:id/delete', async (req, res) => {

    try {

        await Faq.findByIdAndDelete(
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

});


module.exports = router;