const express = require('express');
const router = express.Router();
const axios = require('axios');
const nodemailer = require('nodemailer');

const RentalItem = require('../models/RentalItem');
const RentalOrder = require('../models/RentalOrder');

router.get('/', async (req, res) => {
    try {
        const rentalItems = await RentalItem.find({ isActive: true }).sort({
            category: 1,
            subCategory: 1,
            name: 1
        });

        const groupedItems = {};

        rentalItems.forEach(item => {
            const category = item.category || 'Autres';

            if (!groupedItems[category]) {
                groupedItems[category] = [];
            }

            groupedItems[category].push(item);
        });

        res.render('service/location-form', {
            title: "Formulaire de location",
            returnUrl: req.query.returnUrl || '/location',
            groupedItems
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors du chargement du formulaire de location.');
    }
});

router.post('/checkout', async (req, res) => {
    try {
        const selectedItems = req.body.items || {};
        const orderItems = [];
        let total = 0;

        for (const itemId of Object.keys(selectedItems)) {
            const quantity = parseInt(selectedItems[itemId]) || 0;

            if (quantity > 0) {
                const item = await RentalItem.findById(itemId);

                if (item && item.isActive) {
                    const subtotal = item.price * quantity;

                    total += subtotal;

                    orderItems.push({
                        itemId: item._id,
                        name: item.name,
                        price: item.price,
                        quantity,
                        subtotal
                    });
                }
            }
        }

        const subtotal = total;

        const tps = subtotal * 0.05;
        const tvq = subtotal * 0.09975;

        const taxes = tps + tvq;

        total = subtotal + taxes;

        if (total <= 0) {
            return res.redirect('/location-form?error=items');
        }

        const order = await RentalOrder.create({
            ...req.body,
            items: orderItems,

            subtotal,
            tps,
            tvq,
            taxes,

            total,

            status: 'pending'
        });

        const isProd = process.env.MONERIS_ENV === 'prod';

        const monerisUrl = isProd
            ? 'https://gateway.moneris.com/chkt/request/request.php'
            : 'https://gatewayt.moneris.com/chkt/request/request.php';

        const response = await axios.post(monerisUrl, {
            store_id: process.env.MONERIS_STORE_ID,
            api_token: process.env.MONERIS_API_TOKEN,
            checkout_id: process.env.MONERIS_CHECKOUT_ID,
            txn_total: total.toFixed(2),
            environment: isProd ? 'prod' : 'qa',
            action: 'preload',
            language: 'fr',
            order_no: order._id.toString()
        });

        const ticket = response.data?.response?.ticket;

        if (!ticket) {
            console.log(response.data);
            throw new Error('Aucun ticket Moneris reçu.');
        }

        order.monerisTicket = ticket;
        await order.save();

        res.render('service/location-payment', {
            title: 'Paiement location',
            ticket,
            order,
            monerisEnv: isProd ? 'prod' : 'qa',
            hideFooter: true,
            hideConditionsPopup: true
        });

    } catch (error) {
        console.error('Erreur Moneris preload :', error.response?.data || error.message);
        res.redirect('/location-form?error=payment');
    }
});

router.get('/confirmation', async (req, res) => {
    try {
        const { ticket } = req.query;

        const order = await RentalOrder.findOne({ monerisTicket: ticket });

        if (!order) {
            return res.status(404).send('Commande introuvable.');
        }

        const isProd = process.env.MONERIS_ENV === 'prod';

        const monerisUrl = isProd
            ? 'https://gateway.moneris.com/chkt/request/request.php'
            : 'https://gatewayt.moneris.com/chkt/request/request.php';

        const response = await axios.post(monerisUrl, {
            store_id: process.env.MONERIS_STORE_ID,
            api_token: process.env.MONERIS_API_TOKEN,
            checkout_id: process.env.MONERIS_CHECKOUT_ID,
            ticket,
            environment: isProd ? 'prod' : 'qa',
            action: 'receipt'
        });

        order.paymentReceipt = response.data;
        order.status = 'paid';
        await order.save();

        res.render('service/location-confirmation', {
            title: 'Confirmation location',
            order
        });

    } catch (error) {
        console.error('Erreur confirmation Moneris :', error.response?.data || error.message);
        res.redirect('/location-form?error=confirmation');
    }
});

module.exports = router;