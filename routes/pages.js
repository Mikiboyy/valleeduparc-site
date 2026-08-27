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


module.exports = router;