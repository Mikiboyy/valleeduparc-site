const mongoose = require('mongoose');

const stationConditionsSchema = new mongoose.Schema(
    {
        stationId: {
            type: String,
            required: true,
            unique: true
        },

        pistesJour: {
            type: String,
            default: '0/0'
        },

        pistesNuit: {
            type: String,
            default: '0/0'
        },

        neige24h: {
            type: String,
            default: '0 cm'
        },

        neige48h: {
            type: String,
            default: '0 cm'
        },

        neige7j: {
            type: String,
            default: '0 cm'
        },

        neigeSaison: {
            type: String,
            default: '0 cm'
        },

        telesiegesJour: {
            type: String,
            default: '0/0'
        },

        telesiegesNuit: {
            type: String,
            default: '0/0'
        },

        sousBois: {
            type: String,
            default: '0/0'
        },

        parcNeige: {
            type: String,
            default: '0/0'
        },

        randonnee: {
            type: String,
            default: '0/0'
        },

        statut: {
            type: String,
            default: ''
        },

        updatedAtManeige: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    'StationConditions',
    stationConditionsSchema
);