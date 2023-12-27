const mongoose = require('mongoose');

// define the schema for the League entity
const leagueSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  current_season: { type: Number, required: true },
  logo: { type: String, required: true },
  country_name: { type: String, required: true },
  country_flag: { type: String, required: true },
  teams: [
    {
      id: { type: Number, required: true },
      name: { type: String, required: true },
      logo: { type: String, required: true },
    },
  ],
});

const League = mongoose.model('League', leagueSchema);
module.exports = League;