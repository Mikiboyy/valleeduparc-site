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

// Tri automatique des dates
eventSchema.pre('save', function (next) {

    if (this.dates && this.dates.length > 0) {

        this.dates.sort(
            (a, b) => new Date(a) - new Date(b)
        );

    }

    next();
});

module.exports = mongoose.model('Event', eventSchema);