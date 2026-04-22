const axios = require("axios");

async function getStationStats() {
    try {
        const response = await axios.get(
            "https://valleeduparc.com/wp-admin/admin-ajax.php?action=stationStats_get"
        );

        return response.data;
    } catch (error) {
        console.log("Erreur API station:", error.message);

        return null;
    }
}

module.exports = getStationStats;