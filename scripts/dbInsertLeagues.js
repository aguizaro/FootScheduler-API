const axios = require('axios');
const mongoose = require('mongoose');
const League = require('../models/League');

const MONGODB_URI = process.env.MONGODB_URI;

async function fetchLeagues() {
    try {
        console.log("Fetching leagues");

        const response = await axios.get(process.env.FETCH_LEAGUES_URL, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': process.env.RAPIDAPI_HOST
            }
        });

        const apiResponse = response.data.response;

        for (const entry of apiResponse) {
            const currentSeason = entry.seasons.find(season => season.current === true);

            if (currentSeason) {
                const leagueQuery = { id: entry.league.id };
                const leagueUpdate = {
                  name: entry.league.name,
                  current_season: currentSeason.year,
                  logo: entry.league.logo,
                  country_name: entry.country.name,
                  country_flag: entry.country.flag,
                };
              
                // Find the existing league document or create a new one
                const leagueDocument = await League.findOneAndUpdate(leagueQuery, leagueUpdate, {
                  upsert: true,
                  new: true, // return the updated document if it exists
                  setDefaultsOnInsert: true, // set default values if creating a new document
                });

                console.log(leagueDocument);
            }
        }

        console.log('Leagues successfully fetched and saved to the database.');
    } catch (error) {
        console.error('Error fetching leagues:', error.message);
    }
}

mongoose.connect(MONGODB_URI);

const db = mongoose.connection;

db.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
});

db.once('open', async () => {
    console.log('Connected to MongoDB');
    await fetchLeagues();
    mongoose.disconnect();
});
