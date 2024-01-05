const axios = require('axios');
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI;

async function fetchFixture(league_id, season, team_id) {
    try {
        console.log("Fetching fixtures");

        const response = await axios.get(process.env.FETCH_FIXTURES_URL + "?league=" + league_id , {
            headers: {
                'x-apisports-key': process.env.APISPORTS_KEY
            }
        });

        const apiResponse = response.data.response;

        for (const entry of apiResponse) {
           
        }

    } catch (error) {
        console.error('Error fetching fixtures:', error.message);
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
