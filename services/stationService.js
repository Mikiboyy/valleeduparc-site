const axios = require('axios');
const cheerio = require('cheerio');
const StationConditions = require('../models/StationConditions');

const MANEIGE_URL =
    'https://maneige.ski/xml/stations.xml.php?station=49';


async function updateSnowConditions() {

    try {

        console.log(
            'Récupération des conditions depuis l\'API XML Maneige...'
        );

        const response = await axios.get(MANEIGE_URL, {
            timeout: 15000,
            responseType: 'text',
            headers: {
                'User-Agent': 'ValleeDuParc/1.0'
            }
        });


        const $ = cheerio.load(
            response.data,
            {
                xmlMode: true
            }
        );


        function getValue(name, defaultValue = '') {

            const element = $(name).first();

            if (!element.length) {
                return defaultValue;
            }

            return element.text().trim();
        }


        const conditions = {

            stationId: '49',

            pistesJour:
                `${getValue('intTrailsOpen', '0')}/${getValue('intTrailsTotal', '0')}`,

            pistesNuit:
                `${getValue('intTrailsOpenNight', '0')}/${getValue('intTrailsTotalNight', '0')}`,

            neige24h:
                `${getValue('intSnow24h', '0')} cm`,

            neige48h:
                `${getValue('intSnow48h', '0')} cm`,

            neige7j:
                `${getValue('intSnow7days', '0')} cm`,

            neigeSaison:
                `${getValue('intSnowSeason', '0')} cm`,

            telesiegesJour:
                `${getValue('intLiftsOpen', '0')}/${getValue('intLiftsTotal', '0')}`,

            telesiegesNuit:
                `${getValue('intLiftsOpenNight', '0')}/${getValue('intLiftsTotalNight', '0')}`,

            sousBois:
                `${getValue('intSousBoisOuvert', '0')}/${getValue('intSousBoisTotal', '0')}`,

            parcNeige:
                `${getValue('intSnowParkOpen', '0')}/${getValue('intSnowPark', '0')}`,

            randonnee:
                `${getValue('intAlpineTrailOpen', '0')}/${getValue('intAlpineTrailTotal', '0')}`,

            statut:
                getValue('strOpenFr', 'Fermé')

        };


        await StationConditions.findOneAndUpdate(
            {
                stationId: '49'
            },
            conditions,
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );


        console.log(
            'Conditions Maneige enregistrées dans MongoDB :',
            conditions
        );


        return conditions;


    } catch (error) {

        console.error(
            'Erreur mise à jour conditions Maneige:',
            error.response?.status || error.message
        );

        throw error;
    }
}


async function getSnowConditions() {

    try {

        const conditions =
            await StationConditions.findOne({
                stationId: '49'
            }).lean();


        if (!conditions) {

            console.warn(
                'Aucune condition Maneige trouvée dans MongoDB.'
            );

            return null;
        }


        return conditions;


    } catch (error) {

        console.error(
            'Erreur lecture conditions MongoDB:',
            error.message
        );

        return null;
    }
}


module.exports = {
    getSnowConditions,
    updateSnowConditions
};