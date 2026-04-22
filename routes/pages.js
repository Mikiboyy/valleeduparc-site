const express = require('express');
const router = express.Router();
const pagesController = require('../controllers/pagesController');

router.get('/', pagesController.home);

router.get('/abonnements', pagesController.abonnements);
router.get('/billets', pagesController.billets);
router.get('/luge', pagesController.luge);
router.get('/randonnee', pagesController.randonnee);

router.get('/horaires', pagesController.horaires);
router.get('/conditions', pagesController.conditions);
router.get('/evenements', pagesController.evenements);
router.get('/historique', pagesController.historique);

router.get('/cours-groupe', pagesController.groupe);
router.get('/cours-prive', pagesController.prive);
router.get('/devenir-moniteur', pagesController.moniteur);
router.get('/infos-parents', pagesController.parents);

router.get('/admin', (req, res) => {
    res.render('admin/dashboard');
});

module.exports = router;