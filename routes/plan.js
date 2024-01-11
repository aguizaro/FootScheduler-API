const express = require('express');
const router = express.Router();
const axios = require('axios');
const League = require('../models/League');
const { createPlanner } = require('../scripts/createPlanner');

let processedPairs = []; //array of league ID and team ID pairs that have already been processed
let leaguesWithAll = []; //league IDs for entries with 'All Teams' slected
let processedLeaguesWithAll = []; //league IDs for entries with 'All Teams' slected and already processed

/**
 * This route handler fetches fixtures from the API.
 *
 * @param {Array} entries - An array of league ID and team ID pairs.
 * @returns {Array} An array of fixtures.
 */
router.get('/', async (req, res) => {
  //reset global variables
  processedPairs = [];
  leaguesWithAll = [];
  processedLeaguesWithAll = [];

  const pairs = []; //array of league ID and team ID pairs
  const plannerName = req.query.name || 'My FutPlanner';
  const timeZone = req.query.timeZone || 'America/Los_Angeles';
  const entries = req.query.entries || [];
  let allFixtures = [];
  let currentFixture = [];

  try {
    //process entries into pairs
    for (let i = 0; i < entries.length; i += 2) {
      const league_id = parseInt(entries[i]);
      const team_id = parseInt(entries[i + 1]);

      if (team_id === 0) {
        leaguesWithAll.push(league_id);
      }
      pairs.push([league_id, team_id]);
    }

    console.log('pairs:', pairs);
    //process pair into fixtures
    for (let i = 0; i < pairs.length; i++) {
      const league_id = pairs[i][0];
      const team_id = pairs[i][1];

      //only process pairs that are valid -> check criteria in isValidPair()
      if (isValidPair(league_id, team_id)) {
        console.log('valid pair, processing...', league_id, ' ', team_id);
        currentFixture = await processEntry(league_id, team_id);
        //only add non-empty fixtures
        if (currentFixture.length <= 0)
          throw new Error('No fixtures found for league ID: ' + league_id + ' and team ID: ' + team_id);

        currentFixture = removePassedFixtures(currentFixture);
        allFixtures = allFixtures.concat(currentFixture);
      } else {
        console.log('invalid pair, skipping...', league_id, ' ', team_id);
      }
    }
    const planner = await createPlanner(plannerName, allFixtures, timeZone); //create public google calendar with all fixtures
    if (!planner) throw new Error('Error creating planner.');

    console.log('fixtures len:', allFixtures.length, '\n');
    res.status(200).json({ calendar_name: plannerName, public_calendar_url: planner, fixtures: allFixtures });
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
 * @returns {Promise<Array>} An array of fixtures for the given team in the given league in the current season. Empty array is returned if no fixtures are found.
 */
async function processEntry(league_id, team_id) {
  try {
    const currentSeason = await getCurrentSeason(league_id);
    return await fetchFixtures(league_id, currentSeason, team_id);
  } catch (error) {
    console.error('Error processing entry:', error.message);
    throw error; // rethrow the error to propagate it up the call stack
  }
}

/**
 * This function fetches the current season of a league from the mongodb database.
 *
 * @param {number} league_id
 * @returns {number} The current season of the league.
 */
async function getCurrentSeason(league_id) {
  const leagueEntry = await League.findOne({ id: league_id }, { current_season: 1 });
  return leagueEntry.current_season;
}

/**
 * This function fetches fixtures from API Football using the provided parameters.
 *
 * @param {number} league_id - The ID of the league.
 * @param {number} season - The season of the league.
 * @param {number} team_id - The ID of the team.
 * @returns {Array<Object>} An array of fixtures. Empty array is returned if no fixtures are found.
 */
async function fetchFixtures(league_id, season, team_id) {
  const fixtures = [];
  try {
    let response;
    if (team_id != 0) {
      response = await axios.get(
        process.env.FETCH_FIXTURES_URL + '?league=' + league_id + '&season=' + season + '&team=' + team_id,
        {
          headers: { 'x-apisports-key': process.env.APISPORTS_KEY },
        },
      );
      processedPairs.push([league_id, team_id]);
    } else {
      response = await axios.get(process.env.FETCH_FIXTURES_URL + '?league=' + league_id + '&season=' + season, {
        headers: { 'x-apisports-key': process.env.APISPORTS_KEY },
      });
      processedLeaguesWithAll.push(league_id);
    }

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
 *
 * @param {Array<Object>} fixtures - An array of fixtures.
 * @returns {Array<Object>} An array of future fixtures.
 */
function removePassedFixtures(fixtures) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return fixtures.filter((entry) => parseInt(entry.fixture.timestamp) > currentTimestamp);
}

/**
 * This function checks if the parameters are valid IDs. Team ID can be 0, but league ID cannot. Team ID of 0 represents all teams in a league. IDs must not be negative. IDs already processed and defined inside processedPairs and processedLeaguesWithAll are not valid. League IDs defined inside leaguesWithAll are not valid if team ID is not 0.
 *
 * @param {number} league_id - The ID of the league.
 * @param {number} team_id - The ID of the team.
 * @returns {boolean} True if the parameters are valid, false otherwise.
 */
function isValidPair(league_id, team_id) {
  if (typeof league_id !== 'number' || typeof team_id !== 'number') return false;
  if (isNaN(league_id) || isNaN(team_id)) return false;
  if (league_id < 1 || team_id < 0) return false;
  if (containsPair(processedPairs, [league_id, team_id])) return false; //pair not valid if it already been processed
  if (leaguesWithAll.includes(league_id) && team_id !== 0) return false; //pair not valid if league_id is in LeaguesWithAll unless team_id is 0 (to avoid duplicate fixtures)
  if (processedLeaguesWithAll.includes(league_id)) return false; //pair not valid if league_id is in processedLeaguesWithAll (means all teams in league have already been processed)
  return true;
}

/**
 * This function checks if an array contains a pair of league ID and team ID.
 * @param {Array} array - The array to be searched.
 * @param {Array} pair - The pair to be searched for.
 * @returns {boolean} True if the array contains the pair, false otherwise.
 */
function containsPair(array, pair) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][0] === pair[0] && array[i][1] === pair[1]) return true;
  }
  return false;
}

module.exports = router;
