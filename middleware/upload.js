const multer = require('multer');


/* =========================================================
   TYPES DE FICHIERS AUTORISÉS
========================================================= */

const allowedMimeTypes = [

    'image/jpeg',
    'image/png',
    'image/webp'

];


/* =========================================================
   MULTER
========================================================= */

const storage = multer.memoryStorage();


const upload = multer({

    storage,

    limits: {

        // Maximum 5 MB par image
        fileSize: 5 * 1024 * 1024,

        // Une seule image par formulaire
        files: 1

    },

    fileFilter: (req, file, cb) => {

        if (
            allowedMimeTypes.includes(
                file.mimetype
            )
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    'Format d’image non supporté. Utilisez JPG, PNG ou WEBP.'
                )
            );

        }

    }

});


module.exports = upload;