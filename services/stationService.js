const axios = require("axios");
const cheerio = require("cheerio");

const MANEIGE_URL = "https://maneige.ski/stations/vallee-du-parc/";

// Cache serveur : 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

let cachedConditions = null;
let lastFetch = 0;


/**
 * Récupère les conditions de Vallée du Parc
 * directement depuis maneige.ski
 */
async function getSnowConditions() {

    // -------------------------------------------------
    // UTILISER LE CACHE SI LES DONNÉES SONT RÉCENTES
    // -------------------------------------------------

    if (
        cachedConditions &&
        Date.now() - lastFetch < CACHE_DURATION
    ) {
        return cachedConditions;
    }


    try {

        console.log("Récupération des conditions depuis maneige.ski...");


        // -------------------------------------------------
        // RÉCUPÉRATION DE LA PAGE
        // -------------------------------------------------

        const response = await axios.get(MANEIGE_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            },
            timeout: 10000
        });


        const $ = cheerio.load(response.data);


        // -------------------------------------------------
        // TEXTE DE LA PAGE
        // -------------------------------------------------

        const pageText = $("body")
            .text()
            .replace(/\s+/g, " ")
            .trim();


        // -------------------------------------------------
        // FONCTION POUR EXTRAIRE UNE VALEUR
        // -------------------------------------------------

        function extract(regex, defaultValue = "0") {

            const match = pageText.match(regex);

            if (!match) {
                return defaultValue;
            }

            return match[1].trim();
        }


        // -------------------------------------------------
        // CONDITIONS
        // -------------------------------------------------

        const conditions = {

            // ---------------------------------------------
            // STATUT
            // ---------------------------------------------

            statut: extract(
                /(?:Ouverture prévue le|Fermé pour la saison)\s+(.+?)(?=\s+(?:Dernières accumulations|$))/i,
                "Fermé"
            ),


            // ---------------------------------------------
            // NEIGE
            // ---------------------------------------------

            neige24h: `${extract(
                /24h\s+(\d+)\s*cm/i,
                "0"
            )} cm`,

            neige48h: `${extract(
                /48h\s+(\d+)\s*cm/i,
                "0"
            )} cm`,

            neige7j: `${extract(
                /7 jours\s+(\d+)\s*cm/i,
                "0"
            )} cm`,

            neigeSaison: `${extract(
                /Saison\s+(\d+)\s*cm/i,
                "0"
            )} cm`,


            // ---------------------------------------------
            // PISTES
            // ---------------------------------------------

            pistesJour: extract(
                /Pistes ouvertes\s+Jour\s+(\d+\/\d+)/i,
                "0/0"
            ),

            pistesNuit: extract(
                /Pistes ouvertes\s+Jour\s+\d+\/\d+\s+Nuit\s+(\d+\/\d+)/i,
                "0/0"
            ),


            // ---------------------------------------------
            // SOUS-BOIS
            // ---------------------------------------------

            sousBois: extract(
                /Sous-bois\s+(\d+\/\d+)/i,
                "0/0"
            ),


            // ---------------------------------------------
            // PARC À NEIGE
            // ---------------------------------------------

            parcNeige: extract(
                /Parc à neige\s+(\d+\/\d+)/i,
                "0/0"
            ),


            // ---------------------------------------------
            // RANDONNÉE ALPINE
            // ---------------------------------------------

            randonnee: extract(
                /Randonnée alpine\s+(\d+\/\d+)/i,
                "0/0"
            ),


            // ---------------------------------------------
            // TÉLÉSIÈGES
            // ---------------------------------------------

            telesiegesJour: extract(
                /Télésièges\s+Jour\s+(\d+\/\d+)/i,
                "0/0"
            ),

            telesiegesNuit: extract(
                /Télésièges\s+Jour\s+\d+\/\d+\s+Nuit\s+(\d+\/\d+)/i,
                "0/0"
            )

        };


        // -------------------------------------------------
        // SAUVEGARDE DU CACHE
        // -------------------------------------------------

        cachedConditions = conditions;
        lastFetch = Date.now();


        console.log("Conditions mises à jour :", conditions);


        return conditions;


    } catch (error) {

        console.error(
            "Erreur récupération conditions maneige:",
            error.message
        );


        // -------------------------------------------------
        // SI MANEIGE EST TEMPORAIREMENT INDISPONIBLE
        // ON GARDE LES DERNIÈRES DONNÉES
        // -------------------------------------------------

        if (cachedConditions) {

            console.log(
                "Utilisation des dernières conditions disponibles."
            );

            return cachedConditions;
        }


        return null;
    }
}


module.exports = getSnowConditions;