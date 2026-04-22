const axios = require('axios');

async function getSnowConditions() {
    try {
        const response = await axios.post(
            'https://valleeduparc.com/wp-admin/admin-ajax.php',
            new URLSearchParams({
                action: 'stationStats_get'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0'
                }
            }
        );

        const data = response.data;

        console.log("DATA COMPLETE:", data);

        // On retourne des champs simplifiés pour le frontend
        return {
            pistesJour: `${data.intTrailsOpen}/${data.intTrailsTotal}`,
            pistesNuit: `${data.intTrailsOpenNight}/${data.intTrailsTotalNight}`,

            neige24h: `${data.intSnow24h} cm`,
            neige48h: `${data.intSnow48h} cm`,
            neige7j: `${data.intSnow7days} cm`,
            neigeSaison: `${data.intSnowSeason} cm`,

            telesiegesJour: `${data.intLiftsOpen}/${data.intLiftsTotal}`,
            telesiegesNuit: `${data.intLiftsOpenNight}/${data.intLiftsTotalNight}`,

            sousBois: `${data.intSousBoisOuvert}/${data.intSousBoisTotal}`,
            parcNeige: `${data.intSnowParkOpen}/${data.intSnowPark}`,
            randonnee: `${data.intAlpineTrailOpen}/${data.intAlpineTrailTotal}`,

            statut: data.strOpenFr
        };

    } catch (error) {
        console.log("Erreur récupération conditions :", error.message);

        return {
            pistesJour: "N/A",
            pistesNuit: "N/A",
            neige24h: "N/A",
            neige48h: "N/A",
            neige7j: "N/A",
            neigeSaison: "N/A",
            telesiegesJour: "N/A",
            telesiegesNuit: "N/A",
            sousBois: "N/A",
            parcNeige: "N/A",
            randonnee: "N/A",
            statut: "Information indisponible"
        };
    }
}

/* PAGE ACCUEIL */
exports.home = async (req, res) => {
    const conditions = await getSnowConditions();

    res.render('index', {
        title: "Accueil",
        conditions
    });
};

/* BILLETS */
exports.abonnements = (req, res) => {
    res.render('billets/abonnements', {
        title: "Abonnements"
    });
};

exports.billets = (req, res) => {
    res.render('billets/billets', {
        title: "Billets"
    });
};

exports.luge = (req, res) => {
    res.render('billets/luge', {
        title: "Luge"
    });
};

exports.randonnee = (req, res) => {
    res.render('billets/randonnee', {
        title: "Randonnée"
    });
};

/* MONTAGNE */
exports.horaires = (req, res) => {
    res.render('montagne/horaires', {
        title: "Horaires"
    });
};

exports.conditions = (req, res) => {
    res.render('montagne/conditions', {
        title: "Conditions"
    });
};

exports.evenements = (req, res) => {
    res.render('montagne/evenements', {
        title: "Événements"
    });
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