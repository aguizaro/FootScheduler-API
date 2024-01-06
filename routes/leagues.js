const express = require('express');
const router = express.Router();
const League = require('../models/League');

router.get('/', async (req, res) => {
  try {
    // fetch leagues with non-empty teams array from the database
    const leagues = await League.find({ teams: { $exists: true, $not: { $size: 0 } } });
    res.json(leagues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
