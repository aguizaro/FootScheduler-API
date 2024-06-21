const axios = require('axios');
const mongoose = require('mongoose');
const League = require('../models/League');

const LEAGUES_TO_UPDATE = [
  335, 336, 334, 333, 269, 202, 203, 204, 205, 206, 552, 553, 554, 63, 66, 65, 67, 68, 69, 70, 233, 370, 328, 329, 326,
  570, 377, 339, 338, 199, 198, 197, 79, 80, 529, 81, 512, 513, 312, 313, 131, 129, 132, 133, 134, 188, 191, 193, 418,
  419, 112, 299, 300, 406, 322, 387, 388, 330, 119, 120, 124, 125, 126, 234, 381, 380, 273, 271, 272, 390, 40, 45, 47,
  48, 43, 41, 42, 568, 571, 15,
];

async function updateAllLeagues() {
  const MONGODB_URI = process.env.MONGODB_URI;
  mongoose.connect(MONGODB_URI);

  const db = mongoose.connection;

  db.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
  });

  db.once('open', async () => {
    const rateLimit = 10;
    let counter = 0;
    for (const leagueID of LEAGUES_TO_UPDATE) {
      if (counter > 0 && counter % rateLimit === 0) {
        console.log('Waiting 1 min to avoid rate limit');
        await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
      }
      await updateLeague(leagueID);
      console.log('Updated league:', leagueID);
      counter++;
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

      //console.log(JSON.stringify(league, null, 2));
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

    const response = await axios.get(
      process.env.FETCH_TEAMS_URL + '?league=' + leagueID + '&season=' + current_season,
      {
        headers: {
          'x-apisports-key': process.env.APISPORTS_KEY,
        },
      },
    );

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
