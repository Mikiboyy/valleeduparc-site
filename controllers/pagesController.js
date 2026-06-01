const Trail = require('../models/Trail');
const Event = require('../models/Event');

/* PAGE ACCUEIL */
exports.home = (req, res) => {
    res.render('index', {
        title: "Accueil"
    });
};;

/* BILLETS */
exports.tarifs = (req, res) => {
    res.render('tarifs/tarifs', {
        title: "Tarifs"
    });
};

exports.abonnements = (req, res) => {
    res.render('tarifs/abonnements', {
        title: "Abonnements"
    });
};

exports.billets = (req, res) => {
    res.render('tarifs/billets', {
        title: "Billets"
    });
};

exports.luge = (req, res) => {
    res.render('tarifs/luge', {
        title: "Luge"
    });
};

exports.randonnee = (req, res) => {
    res.render('tarifs/randonnee', {
        title: "Randonnée"
    });
};

/* MONTAGNE */
exports.horaires = (req, res) => {
    res.render('montagne/horaires', {
        title: "Horaires"
    });
};

exports.pente_ecole = (req, res) => {
    res.render('montagne/pente_ecole', {
        title: "Pente école"
    });
};

exports.evenements = async (req, res) => {
    try {
        const now = new Date();

        const upcoming = await Event.find({
            date: { $gte: now }
        }).sort({ date: 1 });

        const past = await Event.find({
            date: { $lt: now }
        }).sort({ date: -1 });

        res.render('montagne/evenements', {
            upcoming,
            past
        });

    } catch (error) {
        console.error(error);
        res.render('montagne/evenements', {
            upcoming: [],
            past: []
        });
    }
};

exports.historique = (req, res) => {
    res.render('montagne/historique', {
        title: "Historique"
    });
};

/* ÉCOLE */
exports.groupe = (req, res) => {
    res.render('ecole/groupe', {
        title: "Cours de groupe"
    });
};

exports.prive = (req, res) => {
    res.render('ecole/prive', {
        title: "Cours privé"
    });
};

exports.moniteur = (req, res) => {
    res.render('ecole/moniteur', {
        title: "Moniteur"
    });
};

exports.parents = (req, res) => {
    res.render('ecole/parents', {
        title: "Parents"
    });
};

exports.inscription = (req, res) => {
    res.render('ecole/inscription', {
        title: "Inscription aux cours",
        returnUrl: req.query.returnUrl || '/'
    });
};

exports.service = (req, res) => {
    res.render('service/service', {
        title: "Services"
    });
};

exports.boutique = (req, res) => {
    res.render('service/boutique', {
        title: "Boutique"
    });
};

exports.location = (req, res) => {
    res.render('service/location', {
        title: "Location"
    });
};

exports.restauration = (req, res) => {
    res.render('service/restauration', {
        title: "Restauration"
    });
};

exports.adapte = (req, res) => {
    res.render('service/adapte', {
        title: "Ski adapté"
    });
};

exports.competition = (req, res) => {
    res.render('service/competition', {
        title: "Ski de compétition"
    });
};

exports.patrouille = (req, res) => {
    res.render('service/patrouille', {
        title: "Patrouille"
    });
};

exports.corpo = (req, res) => {
    res.render('service/corpo', {
        title: "Corpo"
    });
};

exports.montagne = (req, res) => {
    res.render('montagne/montagne', {
        title: "Montagne"
    });
};

exports.ecole = (req, res) => {
    res.render('ecole/ecole', {
        title: "École"
    });
};

exports.contact = (req, res) => {
    res.render('communication/contact', {
        title: "Contact"
    });
};

exports.conditions = async (req, res) => {
    try {
        const trails = await Trail.find().sort({ trailNumber: 1 });

        res.render('montagne/conditions', {
            title: "Conditions",
            trails
        });

    } catch (error) {
        console.log(error);

        res.render('montagne/conditions', {
            title: "Conditions",
            trails: []
        });
    }
};