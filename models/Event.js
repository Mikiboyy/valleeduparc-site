const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        // Plusieurs dates possibles pour un même événement
        dates: {
            type: [Date],
            required: true,
            validate: {
                validator: function (value) {
                    return Array.isArray(value) && value.length > 0;
                },
                message: 'Veuillez sélectionner au moins une date.'
            }
        },

        image: {
            type: String,
            default: ''
        },

        location: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);


// Trier automatiquement les dates avant l'enregistrement
eventSchema.pre('save', function () {

    if (this.dates && this.dates.length > 0) {

        this.dates.sort((a, b) => {
            return new Date(a) - new Date(b);
        });

    }

});


module.exports = mongoose.model('Event', eventSchema);