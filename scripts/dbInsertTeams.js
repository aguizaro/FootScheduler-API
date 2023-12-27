const axios = require('axios');
const mongoose = require('mongoose');
const League = require('../models/League');

//Leagues in DB:
// 39 - Premier League
// 78 - Bundesliga
// 61 - Ligue 1
// 135 - Serie A
// 88 - Eredivisie
// 94 - Primeira Liga
// 140 - La Liga
// 253 - Major League Soccer
// 262 - Liga MX
// 2 - UEFA Champions League
// 3 - UEFA Europa League
// 5 - UEFA Nations League

const LEAGUES_TO_UPDATE = [2, 3, 5];

async function updateAllLeagues() {
    const MONGODB_URI = process.env.MONGODB_URI;
    mongoose.connect(MONGODB_URI);

    const db = mongoose.connection;

    db.on('error', (err) => {
        console.error(`MongoDB connection error: ${err}`);
    });

    db.once('open', async () => {
        console.log('Connected to MongoDB');

        // Loop through leagues sequentially
        for (const leagueID of LEAGUES_TO_UPDATE) {
            await updateLeague(leagueID);
        }

        // Disconnect from MongoDB after updating all leagues
        mongoose.disconnect();
    });
}

async function updateLeague(leagueID) {
    try {
        const league = await League.findOne({ id: leagueID });

        if (league) {
            const teams = await fetchTeams(leagueID, league.current_season);
            league.teams = teams;

            await league.save();

            console.log('League updated successfully:', league);
        } else {
            console.log('League id:', leagueID, ' not found in db');
        }
    } catch (error) {
        console.error('Error updating League id:', leagueID, ' ', error.message);
    }
}

async function fetchTeams(leagueID, current_season) {
    const teams = [];

    try {
        console.log('Fetching teams');

        const response = await axios.get(process.env.FETCH_TEAMS_URL + leagueID + '&season=' + current_season, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': process.env.RAPIDAPI_HOST,
            },
        });

        const apiResponse = response.data.response;

        for (const entry of apiResponse) {
            const team = {
                id: entry.team.id,
                name: entry.team.name,
                logo: entry.team.logo,
            };

            teams.push(team);
            console.log('Added team:', team);
        }

        console.log('Teams for league:', leagueID, 'successfully fetched.');
        return teams;
    } catch (error) {
        console.error('Error fetching teams for league:', leagueID, '->', error.message);
        return [];
    }
}

// Start the process
updateAllLeagues();
