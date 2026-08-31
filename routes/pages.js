const express = require('express');
const router = express.Router();
const pagesController = require('../controllers/pagesController');

router.get('/', pagesController.home);

router.get('/tarifs', pagesController.tarifs);
router.get('/abonnements', pagesController.abonnements);
router.get('/billets', pagesController.billets);
router.get('/luge', pagesController.luge);
router.get('/randonnee', pagesController.randonnee);
router.get('/promo', pagesController.promo);

router.get('/montagne', pagesController.montagne);
router.get('/horaires', pagesController.horaires);
router.get('/conditions', pagesController.conditions);
router.get('/evenements', pagesController.evenements);
router.get('/historique', pagesController.historique);
router.get('/pente_ecole', pagesController.pente_ecole);

router.get('/ecole', pagesController.ecole);
router.get('/cours-groupe', pagesController.groupe);
router.get('/cours-prive', pagesController.prive);
router.get('/devenir-moniteur', pagesController.moniteur);
router.get('/infos-parents', pagesController.parents);
router.get('/inscription', pagesController.inscription);

router.get('/service', pagesController.service);
router.get('/location', pagesController.location);
router.get('/restauration', pagesController.restauration);
router.get('/corpo', pagesController.corpo);
router.get('/scolaire', pagesController.scolaire);
router.get('/ski_adapte', pagesController.ski_adapte);
router.get('/patrouille', pagesController.patrouille);
router.get('/corpo_form', pagesController.corpo_form);
router.get('/salle_form', pagesController.salle_form);
router.get('/giftcard', pagesController.giftcard);
router.get('/boutique', pagesController.boutique);

router.get('/info_carrieres', pagesController.info_carrieres);
router.get('/contact', pagesController.contact);
router.get('/faq', pagesController.faq);
router.get('/carrieres', pagesController.carrieres);

router.get('/rfid', pagesController.rfid);

// ==================================================
// ANCIENNES URL DU SITE
// REDIRECTIONS 301
// ==================================================

router.get('/recharge', (req, res) => {
    res.redirect(301, '/rfid');
});

router.get('/conditions-des-pistes', (req, res) => {
    res.redirect(301, '/conditions');
});

router.get('/location-dequipement', (req, res) => {
    res.redirect(301, '/location');
});

router.get('/horaire', (req, res) => {
    res.redirect(301, '/horaires');
});

router.get('/Montagne & Horaire', (req, res) => {
    res.redirect(301, '/evenements');
});

router.get('/billets-journaliers', (req, res) => {
    res.redirect(301, '/billets');
});

router.get('/abonnement-de-saison', (req, res) => {
    res.redirect(301, '/abonnements');
});

router.get('/randonnee-alpine', (req, res) => {
    res.redirect(301, '/randonnee');
});

router.get('/ski-adapte', (req, res) => {
    res.redirect(301, '/ski_adapte');
});

router.get('/luge-alpine-luge-nocturne', (req, res) => {
    res.redirect(301, '/luge');
});

module.exports = router;