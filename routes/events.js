const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Page événements
router.get('/', async (req, res) => {
    const upcoming = await Event.find({ isPast: false }).sort({ date: 1 });
    const past = await Event.find({ isPast: true }).sort({ date: -1 });

    res.render('events', { upcoming, past });
});

module.exports = router;