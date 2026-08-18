const Trail = require('../models/trail');
const Event = require('../models/Event');
const SubscriptionPrice = require('../models/SubscriptionPrice');
const DailyTicketPrice = require('../models/DailyTicketPrice');
const RentalItem = require('../models/RentalItem');
const SchoolCourse = require('../models/SchoolCourse');

/* PAGE ACCUEIL */
exports.home = async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments({});

        const events = await Event.find({})
            .sort({ date: -1 })
            .limit(3);

        res.render('index', {
            title: 'Accueil',
            events,
            totalEvents
        });

    } catch (error) {
        console.error('Erreur accueil :', error);
        res.render('index', {
            title: 'Accueil',
            events: [],
            totalEvents: 0
        });
    }
};

/* BILLETS */
exports.tarifs = (req, res) => {
    res.render('tarifs/tarifs', {
        title: "Tarifs"
    });
};

exports.abonnements = async (req, res) => {
    try {
        const prices = await SubscriptionPrice.find({ isActive: true })
            .sort({ category: 1, order: 1 });

        const categoriesOrder = [
            'Tout temps',
            'Presque tout-temps',
            'Soirée',
            '3 jours',
            'Famille (3 personnes min.)',
            'Autres'
        ];

        const groupedPrices = categoriesOrder.map(category => ({
            category,
            items: prices.filter(price => price.category === category)
        }));

        res.render('tarifs/abonnements', {
            title: 'Abonnements',
            groupedPrices
        });

    } catch (error) {
        console.error('Erreur abonnements :', error);

        res.render('tarifs/abonnements', {
            title: 'Abonnements',
            groupedPrices: []
        });
    }
};

exports.billets = async (req, res) => {
    try {
        const prices = await DailyTicketPrice.find({ isActive: true })
            .sort({
                categoryOrder: 1,
                ticketOrder: 1,
                ageOrder: 1
            });

        const groupedTickets = [];

        prices.forEach(price => {
            let categoryGroup = groupedTickets.find(group => group.category === price.category);

            if (!categoryGroup) {
                categoryGroup = {
                    category: price.category,
                    tickets: []
                };

                groupedTickets.push(categoryGroup);
            }

            let ticketGroup = categoryGroup.tickets.find(ticket => ticket.ticketType === price.ticketType);

            if (!ticketGroup) {
                ticketGroup = {
                    ticketType: price.ticketType,
                    items: []
                };

                categoryGroup.tickets.push(ticketGroup);
            }

            ticketGroup.items.push(price);
        });

        res.render('tarifs/billets', {
            title: 'Billets',
            groupedTickets
        });

    } catch (error) {
        console.error('Erreur billets :', error);

        res.render('tarifs/billets', {
            title: 'Billets',
            groupedTickets: []
        });
    }
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

exports.promo = (req, res) => {
    res.render('tarifs/promo', {
        title: "Promotions"
    });
};

exports.pente_ecole = (req, res) => {
    res.render('montagne/pente_ecole', {
        title: "Pente école"
    });
};

exports.evenements = async (req, res) => {
    try {

        const allEvents = await Event
            .find()
            .sort({ date: 1 });

        res.render('montagne/evenements', {
            title: 'Événements',
            allEvents
        });

    } catch (error) {

        console.error(
            "Erreur lors du chargement des événements :",
            error
        );

        res.status(500).send(
            "Erreur lors du chargement des événements."
        );
    }
};

exports.historique = (req, res) => {
    res.render('montagne/historique', {
        title: "Historique"
    });
};

/* ÉCOLE */
exports.groupe = async (req, res) => {
    try {
        const courses = await SchoolCourse.find({
            type: 'groupe',
            isActive: true
        }).sort({ season: 1, order: 1 });

        res.render('ecole/groupe', {
            title: "Cours de groupe",
            courses
        });

    } catch (error) {
        console.error('Erreur cours de groupe :', error);

        res.render('ecole/groupe', {
            title: "Cours de groupe",
            courses: []
        });
    }
};

exports.prive = async (req, res) => {
    try {
        const courses = await SchoolCourse.find({
            type: 'prive',
            isActive: true
        }).sort({ season: 1, order: 1 });

        res.render('ecole/prive', {
            title: "Cours privé",
            courses
        });

    } catch (error) {
        console.error('Erreur cours privés :', error);

        res.render('ecole/prive', {
            title: "Cours privé",
            courses: []
        });
    }
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

exports.scolaire = (req, res) => {
    res.render('service/scolaire', {
        title: "Groupes Scolaires"
    });
};

exports.location = async (req, res) => {
    try {
        const rentalItems = await RentalItem.find({ isActive: true }).sort({ order: 1 });

        res.render('service/location', {
            title: "Location",
            rentalItems
        });

    } catch (error) {
        console.error('Erreur location :', error);

        res.render('service/location', {
            title: "Location",
            rentalItems: []
        });
    }
};

exports.restauration = (req, res) => {
    res.render('service/restauration', {
        title: "Restauration"
    });
};

exports.ski_adapte = (req, res) => {
    res.render('service/ski_adapte', {
        title: "Ski adapté"
    });
};

exports.patrouille = (req, res) => {
    res.render('service/patrouille', {
        title: "Patrouille"
    });
};

exports.giftcard = (req, res) => {
    res.render('service/giftcard', {
        title: "Cartes-cadeaux"
    });
};

exports.corpo = (req, res) => {
    res.render('service/corpo', {
        title: "Corpo"
    });
};

exports.corpo_form = (req, res) => {
    res.render('service/corpo_form', {
        title: "Activité groupe corporatifs"
    });
};

exports.salle_form = (req, res) => {
    res.render('service/salle_form', {
        title: "Location de salle"
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

exports.info_carrieres = (req, res) => {
    res.render('communication/info_carrieres', {
        title: "Infos et carrières"
    });
};

exports.contact = (req, res) => {
    res.render('communication/contact', {
        title: "Contact"
    });
};

exports.faq = (req, res) => {
    res.render('communication/faq', {
        title: "F.A.Q."
    });
};

exports.carrieres = async (req, res) => {
    try {
        let jobs = [];

        try {
            const Job = require('../models/Job');
            jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
        } catch (dbError) {
            console.log("Aucun modèle Job trouvé ou erreur MongoDB :", dbError.message);
        }

        res.render('communication/carrieres', {
            title: 'Carrières',
            jobs: jobs
        });

    } catch (error) {
        console.error(error);

        res.render('communication/carrieres', {
            title: 'Carrières',
            jobs: []
        });
    }
};

exports.rfid = (req, res) => {
    res.render('RFID/rfid', {
        title: "RFID"
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