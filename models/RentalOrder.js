const mongoose = require('mongoose');

const rentalOrderSchema = new mongoose.Schema({
    nom: String,
    email: String,
    telephone: String,
    dateLocation: String,
    typeEquipement: String,
    typeLocation: String,
    periode: String,
    heureArrivee: String,

    age: String,
    dateNaissance: String,
    sexe: String,
    grandeur: String,
    poids: String,
    pointure: String,
    niveau: String,
    subtotal: Number,
    tps: Number,
    tvq: Number,
    taxes: Number,

    items: [
        {
            itemId: mongoose.Schema.Types.ObjectId,
            name: String,
            price: Number,
            quantity: Number,
            subtotal: Number
        }
    ],

    total: Number,
    monerisTicket: String,
    status: {
        type: String,
        default: 'pending'
    },
    paymentReceipt: Object
}, {
    timestamps: true
});

module.exports = mongoose.model('RentalOrder', rentalOrderSchema);