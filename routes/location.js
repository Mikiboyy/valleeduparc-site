const express = require('express');
const router = express.Router();
const axios = require('axios');
const nodemailer = require('nodemailer');

const RentalItem = require('../models/RentalItem');
const RentalOrder = require('../models/RentalOrder');


/* =========================
   CONFIGURATION SMTP
   MAILERSEND
========================= */

const transporter = nodemailer.createTransport({

    host: 'smtp.mailersend.net',

    port: 2525,

    secure: false,

    requireTLS: true,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    connectionTimeout: 10000,

    greetingTimeout: 10000,

    socketTimeout: 30000

});


/* =========================
   FORMULAIRE DE LOCATION
========================= */

router.get('/', async (req, res) => {

    try {

        const rentalItems = await RentalItem
            .find({
                isActive: true
            })
            .sort({
                category: 1,
                subCategory: 1,
                name: 1
            });


        const groupedItems = {};


        rentalItems.forEach(item => {

            const category =
                item.category || 'Autres';


            if (!groupedItems[category]) {

                groupedItems[category] = [];

            }


            groupedItems[category].push(item);

        });


        res.render(
            'service/location-form',
            {

                title: "Formulaire de location",

                returnUrl:
                    req.query.returnUrl ||
                    '/location',

                groupedItems

            }
        );


    } catch (error) {

        console.error(
            'Erreur formulaire location :',
            error
        );


        res.status(500).send(
            'Erreur lors du chargement du formulaire de location.'
        );

    }

});


/* =========================
   CHECKOUT
========================= */

router.post('/checkout', async (req, res) => {

    try {

        const selectedItems =
            req.body.items || {};

        const orderItems = [];

        let total = 0;


        /* =========================
           CALCUL DES ARTICLES
        ========================= */

        for (
            const itemId of Object.keys(selectedItems)
        ) {

            const quantity =
                parseInt(selectedItems[itemId]) || 0;


            if (quantity > 0) {

                const item =
                    await RentalItem.findById(itemId);


                if (
                    item &&
                    item.isActive
                ) {

                    const subtotal =
                        item.price * quantity;


                    total += subtotal;


                    orderItems.push({

                        itemId:
                            item._id,

                        name:
                            item.name,

                        price:
                            item.price,

                        quantity,

                        subtotal

                    });

                }

            }

        }


        /* =========================
           CALCUL DES TAXES
        ========================= */

        const subtotal = total;

        const tps =
            subtotal * 0.05;

        const tvq =
            subtotal * 0.09975;

        const taxes =
            tps + tvq;

        total =
            subtotal + taxes;


        /* =========================
           VALIDATION
        ========================= */

        if (total <= 0) {

            return res.redirect(
                '/location-form?error=items'
            );

        }


        /* =========================
           CRÉATION COMMANDE
        ========================= */

        const order =
            await RentalOrder.create({

                ...req.body,

                items:
                    orderItems,

                subtotal,

                tps,

                tvq,

                taxes,

                total,

                status:
                    'pending'

            });


        /* =========================
           ENVIRONNEMENT MONERIS
        ========================= */

        const isProd =
            process.env.MONERIS_ENV === 'prod';


        const monerisUrl =
            isProd

                ? 'https://gateway.moneris.com/chkt/request/request.php'

                : 'https://gatewayt.moneris.com/chkt/request/request.php';


        /* =========================
           PRELOAD MONERIS
        ========================= */

        const response =
            await axios.post(
                monerisUrl,
                {

                    store_id:
                        process.env.MONERIS_STORE_ID,

                    api_token:
                        process.env.MONERIS_API_TOKEN,

                    checkout_id:
                        process.env.MONERIS_CHECKOUT_ID,

                    txn_total:
                        total.toFixed(2),

                    environment:
                        isProd
                            ? 'prod'
                            : 'qa',

                    action:
                        'preload',

                    language:
                        'fr',

                    order_no:
                        order._id.toString()

                }
            );


        const ticket =
            response.data?.response?.ticket;


        if (!ticket) {

            console.log(
                'Réponse Moneris :',
                response.data
            );


            throw new Error(
                'Aucun ticket Moneris reçu.'
            );

        }


        /* =========================
           SAUVEGARDE DU TICKET
        ========================= */

        order.monerisTicket =
            ticket;

        await order.save();


        /* =========================
           PAGE DE PAIEMENT
        ========================= */

        res.render(
            'service/location-payment',
            {

                title:
                    'Paiement location',

                ticket,

                order,

                monerisEnv:
                    isProd
                        ? 'prod'
                        : 'qa',

                hideFooter:
                    true,

                hideConditionsPopup:
                    true

            }
        );


    } catch (error) {

        console.error(
            'Erreur Moneris preload :',
            error.response?.data ||
            error.message
        );


        res.redirect(
            '/location-form?error=payment'
        );

    }

});


/* =========================
   CONFIRMATION DE PAIEMENT
========================= */

router.get('/confirmation', async (req, res) => {

    try {

        const { ticket } =
            req.query;


        if (!ticket) {

            return res.redirect(
                '/location-form?error=confirmation'
            );

        }


        /* =========================
           RECHERCHE COMMANDE
        ========================= */

        const order =
            await RentalOrder.findOne({

                monerisTicket:
                    ticket

            });


        if (!order) {

            return res
                .status(404)
                .send(
                    'Commande introuvable.'
                );

        }


        const isProd =
            process.env.MONERIS_ENV === 'prod';


        const monerisUrl =
            isProd

                ? 'https://gateway.moneris.com/chkt/request/request.php'

                : 'https://gatewayt.moneris.com/chkt/request/request.php';


        /* =========================
           RÉCUPÉRATION DU REÇU
        ========================= */

        const response =
            await axios.post(
                monerisUrl,
                {

                    store_id:
                        process.env.MONERIS_STORE_ID,

                    api_token:
                        process.env.MONERIS_API_TOKEN,

                    checkout_id:
                        process.env.MONERIS_CHECKOUT_ID,

                    ticket,

                    environment:
                        isProd
                            ? 'prod'
                            : 'qa',

                    action:
                        'receipt'

                }
            );


        /* =========================
           SAUVEGARDE PAIEMENT
        ========================= */

        order.paymentReceipt =
            response.data;

        order.status =
            'paid';

        await order.save();


        /* =========================
           ENVOI DES COURRIELS

           Seulement si le courriel
           n'a pas déjà été envoyé
        ========================= */

        if (!order.emailSent) {

            /* =========================
               COURRIEL AU CLIENT
            ========================= */

            await transporter.sendMail({

                from:
                    `"Vallée du Parc" <${process.env.SMTP_USER}>`,

                to:
                    order.email,

                subject:
                    'Confirmation de votre location - Vallée du Parc',

                html: `

                    <h2>
                        Bonjour ${order.prenom || ''},
                    </h2>

                    <p>
                        Nous avons bien reçu votre réservation
                        de location.
                    </p>

                    <h3>
                        Détails de votre commande
                    </h3>

                    <p>
                        <strong>
                            Numéro de commande :
                        </strong>

                        ${order._id}
                    </p>

                    <table
                        style="
                            width:100%;
                            border-collapse:collapse;
                        "
                    >

                        <thead>

                            <tr>

                                <th
                                    style="
                                        text-align:left;
                                        border-bottom:1px solid #ddd;
                                        padding:8px;
                                    "
                                >
                                    Article
                                </th>

                                <th
                                    style="
                                        text-align:center;
                                        border-bottom:1px solid #ddd;
                                        padding:8px;
                                    "
                                >
                                    Quantité
                                </th>

                                <th
                                    style="
                                        text-align:right;
                                        border-bottom:1px solid #ddd;
                                        padding:8px;
                                    "
                                >
                                    Total
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${order.items.map(item => `

                                <tr>

                                    <td
                                        style="
                                            padding:8px;
                                        "
                                    >
                                        ${item.name}
                                    </td>

                                    <td
                                        style="
                                            text-align:center;
                                            padding:8px;
                                        "
                                    >
                                        ${item.quantity}
                                    </td>

                                    <td
                                        style="
                                            text-align:right;
                                            padding:8px;
                                        "
                                    >
                                        ${Number(
                                            item.subtotal
                                        ).toFixed(2)} $
                                    </td>

                                </tr>

                            `).join('')}

                        </tbody>

                    </table>


                    <hr>


                    <p>

                        <strong>
                            Sous-total :
                        </strong>

                        ${Number(
                            order.subtotal
                        ).toFixed(2)} $

                    </p>


                    <p>

                        <strong>
                            TPS :
                        </strong>

                        ${Number(
                            order.tps
                        ).toFixed(2)} $

                    </p>


                    <p>

                        <strong>
                            TVQ :
                        </strong>

                        ${Number(
                            order.tvq
                        ).toFixed(2)} $

                    </p>


                    <h3>

                        Total payé :
                        ${Number(
                            order.total
                        ).toFixed(2)} $

                    </h3>


                    <br>


                    <p>
                        Merci d'avoir choisi
                        <strong>
                            Vallée du Parc
                        </strong>.
                    </p>

                `

            });


            /* =========================
               COURRIEL À VALLÉE DU PARC
            ========================= */

            if (
                process.env
                    .FORM_RECEIVER_LOCATION
            ) {

                await transporter.sendMail({

                    from:
                        `"Site Vallée du Parc" <${process.env.SMTP_USER}>`,

                    to:
                        process.env
                            .FORM_RECEIVER_LOCATION,

                    replyTo:
                        order.email,

                    subject:
                        `Nouvelle location - ${order._id}`,

                    html: `

                        <h2>
                            Nouvelle réservation de location
                        </h2>

                        <p>

                            <strong>
                                Client :
                            </strong>

                            ${order.prenom || ''}
                            ${order.nom || ''}

                        </p>


                        <p>

                            <strong>
                                Courriel :
                            </strong>

                            ${order.email}

                        </p>


                        <p>

                            <strong>
                                Téléphone :
                            </strong>

                            ${order.telephone || 'Non précisé'}

                        </p>


                        <h3>
                            Articles
                        </h3>


                        <ul>

                            ${order.items.map(item => `

                                <li>

                                    ${item.quantity} ×
                                    ${item.name}

                                </li>

                            `).join('')}

                        </ul>


                        <h3>

                            Total :
                            ${Number(
                                order.total
                            ).toFixed(2)} $

                        </h3>

                    `

                });

            }


            /* =========================
               MARQUER COMME ENVOYÉ
            ========================= */

            order.emailSent =
                true;

            await order.save();

        }


        /* =========================
           PAGE CONFIRMATION
        ========================= */

        res.render(
            'service/location-confirmation',
            {

                title:
                    'Confirmation location',

                order

            }
        );


    } catch (error) {

        console.error(
            'Erreur confirmation Moneris :',
            error.response?.data ||
            error.message
        );


        res.redirect(
            '/location-form?error=confirmation'
        );

    }

});


module.exports = router;