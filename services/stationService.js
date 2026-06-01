const axios = require("axios");

async function getSnowConditions() {
    try {
        const response = await axios.post(
            "https://valleeduparc.com/wp-admin/admin-ajax.php",
            new URLSearchParams({
                action: "stationStats_get"
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        const data = response.data;

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
        console.log("Erreur API station:", error.message);
        return null;
    }
}

module.exports = getSnowConditions;