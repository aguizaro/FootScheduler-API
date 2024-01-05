const express = require('express');
const router = express.Router();
const axios = require('axios');
const League = require('../models/League');

/**
 * This route handler fetches fixtures from the API.
 * @param {Array} entries - An array of league ID and team ID pairs.
 * @returns {Array} An array of fixtures.
 */

router.get('/', async (req, res) => {
  const entries = req.query.entries || [];
  let allFixtures = [];

  try {
    for (let i = 0; i < entries.length; i += 2) {
      const league_id = parseInt(entries[i]);
      const team_id = parseInt(entries[i + 1]);
      allFixtures = await processEntry(league_id, team_id);
    }

    allFixtures = removePassedFixtures(allFixtures);
    res.json({ allFixtures });
  } catch (error) {
    console.error('Error in the main handler:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * This function processes a pair of league ID and team ID to fetch fixtures.
 *
 * @param {number} league_id - The ID of the league.
 * @param {number} team_id - The ID of the team.
 * @returns {Promise<Array>} An array of fixtures.
 */
async function processEntry(league_id, team_id) {
  try {
    if (!team_id || isNaN(team_id) || !league_id || isNaN(league_id)) {
      throw new Error('Invalid parameters passed to "processEntry"');
    }
    const currentSeason = await getCurrentSeason(league_id);
    return await fetchFixture(league_id, currentSeason, team_id);
  } catch (error) {
    console.error('Error processing entry:', error.message);
    throw error; // rethrow the error to propagate it up the call stack
  }
}

/**
 * This function fetches the current season of a league from the mongodb database.
 * @param {number} league_id
 * @returns {number} The current season of the league.
 */
async function getCurrentSeason(league_id) {
  const leagueEntry = await League.findOne({ id: league_id }, { current_season: 1 });

  return leagueEntry.current_season;
}

/**
 * This function fetches fixtures from the API.
 * @param {number} league_id - The ID of the league.
 * @param {number} season - The season of the league.
 * @param {number} team_id - The ID of the team.
 * @returns {Array<Object>} An array of fixtures.
 */
async function fetchFixture(league_id, season, team_id) {
  const fixtures = [];
  try {
    if (team_id === -1) throw new Error('Team ID not valid');
    const response =
      team_id != 0
        ? await axios.get(
            process.env.FETCH_FIXTURES_URL + '?league=' + league_id + '&season=' + season + '&team=' + team_id,
            {
              headers: { 'x-apisports-key': process.env.APISPORTS_KEY },
            },
          )
        : await axios.get(process.env.FETCH_FIXTURES_URL + '?league=' + league_id, {
            headers: { 'x-apisports-key': process.env.APISPORTS_KEY },
          });

    const apiResponse = response.data.response;

    for (const entry of apiResponse) {
      const fixture = { fixture: entry.fixture, league: entry.league, teams: entry.teams };
      fixtures.push(fixture);
    }
    return fixtures;
  } catch (error) {
    console.error('Error fetching fixtures:', error.message);
  }
}

/**
 * This function filters out passed fixtures.
 * @param {Array<Object>} fixtures - An array of fixtures.
 * @returns {Array<Object>} An array of future fixtures.
 */
function removePassedFixtures(fixtures) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return fixtures.filter((entry) => parseInt(entry.fixture.timestamp) > currentTimestamp);
}

module.exports = router;
