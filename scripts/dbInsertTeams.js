const axios = require('axios');
const mongoose = require('mongoose');
const League = require('../models/League');

//Leagues in DB:
// 1 - 100
// 101 - 163
// 164 - 213
// 214 - 253
// 254 - 300
// 301 - 350



const LEAGUES_TO_UPDATE = [21, 71, 180, 804];

async function updateAllLeagues() {
    const MONGODB_URI = process.env.MONGODB_URI;
    mongoose.connect(MONGODB_URI);

    const db = mongoose.connection;

    db.on('error', (err) => {
        console.error(`MongoDB connection error: ${err}`);
    });

    db.once('open', async () => {
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

            console.log(JSON.stringify(league, null, 2));
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
        //console.log('Fetching teams');

        const response = await axios.get(process.env.FETCH_TEAMS_URL + '?league='+ leagueID + '&season=' + current_season, {
            headers: {
                'x-apisports-key': process.env.APISPORTS_KEY
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
            //console.log('Added team:', team);
        }

        //console.log('Teams for league:', leagueID, 'successfully fetched.');
        return teams;
    } catch (error) {
        console.error('Error fetching teams for league:', leagueID, '->', error.message);
        return [];
    }
}

// Start the process
updateAllLeagues();
