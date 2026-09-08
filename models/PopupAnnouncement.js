const mongoose = require('mongoose');

const popupAnnouncementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        imageUrl: {
            type: String,
            default: ''
        },

        buttonText: {
            type: String,
            default: ''
        },

        buttonLink: {
            type: String,
            default: ''
        },

        isActive: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    'PopupAnnouncement',
    popupAnnouncementSchema
);