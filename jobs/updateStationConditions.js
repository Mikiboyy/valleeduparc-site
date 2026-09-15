const mongoose = require('mongoose');
const {
    updateSnowConditions
} = require('../services/stationService');


async function main() {

    try {

        if (!process.env.MONGODB_URI) {
            throw new Error(
                'MONGODB_URI n\'est pas configurée.'
            );
        }


        console.log(
            'Connexion à MongoDB pour le CRON...'
        );


        await mongoose.connect(
            process.env.MONGODB_URI
        );


        console.log(
            'MongoDB connecté.'
        );


        await updateSnowConditions();


        console.log(
            'Mise à jour des conditions terminée.'
        );


        await mongoose.disconnect();


        process.exit(0);


    } catch (error) {

        console.error(
            'Erreur CRON conditions:',
            error
        );


        await mongoose.disconnect().catch(() => {});


        process.exit(1);
    }
}


main();