const express = require('express');
const router = express.Router();
const League = require('../models/League');


router.get('/', async (req, res) => {
    try {
      const countries = await League.aggregate([
        {
          $match: {
            'teams': { $exists: true, $not: { $size: 0 } }
          }
        },
        {
          $group: {
            _id: '$country_name',
            name: { $first: '$country_name' },
            flag: { $first: '$country_flag' },
            leagues: {
              $push: {
                id: '$id',
                name: '$name',
                current_season: '$current_season',
                logo: '$logo',
                teams: '$teams'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            name: 1,
            flag: 1,
            leagues: 1
          }
        }
      ]);
  
      res.json({ countries });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  
module.exports = router;