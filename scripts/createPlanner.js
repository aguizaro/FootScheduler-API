const { google } = require('googleapis');
const calendar = google.calendar('v3');
const { refreshAccess } = require('./refreshToken');
const sampleFixtures = require('../sampleFixtures.json'); //update this to use request from route rather than sample data

async function createPlanner(data, timeZone = 'America/Los_Angeles') {
  try {
    const client = await refreshAccess(1);
    const newCalendar = await createCalendar(client, {
      title: 'FutPlanner',
      description: 'This calendar contains events representing upcoming football matches.',
    });

    // insert event into the calendar for each fixture
    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      const formattedStartTime = new Date(entry.fixture.timestamp * 1000).toISOString();
      const formattedEndTime = new Date((entry.fixture.timestamp + 7200) * 1000).toISOString(); // 2 hrs later
      const newEvent = await insertEvent(client, newCalendar.data.id, {
        title: `${entry.teams.home.name} vs ${entry.teams.away.name} | ${entry.league.name}`,
        description: `${entry.league.name} - ${entry.league.season} Season - Round: ${lastDigits(
          entry.league.round,
        )}\n${entry.teams.home.name} vs ${entry.teams.away.name}\n${entry.fixture.venue.name} - ${
          entry.fixture.venue.city
        }, ${entry.league.country}`,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        location: `${entry.fixture.venue.name}, ${entry.fixture.venue.city}`,
      });
    }

    const public_calendar_url = `https://calendar.google.com/calendar/embed?src=${newCalendar.data.id}&ctz=${timeZone}`;
    const embed_calendar_url = `<iframe src="${public_calendar_url}" style="border: 0" width="400" height="300" frameborder="0" scrolling="no"></iframe>`;
    return { public_calendar_url, embed_calendar_url };
  } catch (error) {
    console.error('Error in testClient(): ', error);
  }
}

/**
 * This function lists all the calendars in the user's account. This functin requires that the user has already authenticated and has a valid refresh token stored in the database.
 *
 * @returns {Object} The list of calendars.
 */
async function listCalendars() {
  try {
    const client = await refreshAccess(1);

    const calendarList = await calendar.calendarList.list({
      auth: client,
    });

    console.log(calendarList.data);
  } catch (error) {
    console.error('Error in listCalendars(): ', error);
  }
}

/**
 * This function creates a new calendar with the given title and description.
 *
 * @param {OAuth2Client} authClient - The OAuth2 client to use to make API calls.
 * @param {Object} body - The object representing the calendar data to insert into requestBody.
 * @returns {Object} The newly created calendar.
 */
async function createCalendar(authClient, body) {
  try {
    const newCalendar = await calendar.calendars.insert({
      auth: authClient,
      requestBody: {
        summary: body.title,
        description: body.description,
        timeZone: 'UTC',
      },
    });

    return newCalendar;
  } catch (error) {
    console.error('Error in createCalendar(): ', error);
  }
}

/**
 * This function inserts an event into the given calendar.
 *
 * @param {OAuth2Client} authClient - The OAuth2 client to use to make API calls.
 * @param {string} calendarID - The ID of the calendar to insert the event into.
 * @param {Object} body - The object representing the event data to insert into requestBody.
 * @returns {Object} The newly created event.
 */
async function insertEvent(authClient, calendarID, body) {
  try {
    if (body.colorId === undefined) body.colorId = 1; //default color is blue
    const newEvent = await calendar.events.insert({
      auth: authClient,
      calendarId: calendarID,
      requestBody: {
        summary: body.title,
        description: body.description,
        colorId: body.colorId,
        location: body.location,
        start: {
          dateTime: body.startTime,
        },
        end: {
          dateTime: body.endTime,
        },
      },
    });

    return newEvent;
  } catch (error) {
    console.error('Error in insertEvent(): ', error);
  }
}

/**
 * This function will extract the last digits from a string and return those digits as a string.
 * @param {string} text The text to search for trailing digits.
 * @returns {string | null} The number of minutes in the description.
 */
function lastDigits(text) {
  const match = text.match(/\d+$/);
  return match ? match[0] : null;
}

// test create planner with sample fixtures
createPlanner(sampleFixtures.allFixtures)
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
