const { google } = require('googleapis');
const { refreshAccess } = require('./refreshToken');
const { OAuth2Client } = require('google-auth-library');

const calendar = google.calendar('v3');

/**
 * This function creates a new public calendar using the given data via google calendar api. This function requires that the root user has a valid refresh token stored in the database.
 *
 * @param {string} name - The name used for the google calendar entry.
 * @param {Object} events - The object representing the calendar events to insert into requestBody.
 * @param {string} timeZone - The time zone to use for the calendar.
 * @returns {Object} The public planner URL link. This link can be used to embed the calendar into a website or import the calendar into a google account. False is returned if an error occurs.
 */
async function createPlanner(name, events, timeZone = 'America/Los_Angeles') {
  try {
    const authClient = await refreshAccess(1); //get OAuth2 client for root user
    const newCalendar = await createCalendar(authClient, {
      title: name,
      description: 'This calendar contains events representing football matches.',
    });
    if (!newCalendar) throw new Error('Error creating calendar.');

    const publicAclRule = await calendar.acl.insert({
      auth: authClient,
      calendarId: newCalendar.data.id,
      requestBody: {
        role: 'reader',
        scope: {
          type: 'default',
        },
      },
    });

    // insert event into the calendar for each fixture
    for (let i = 0; i < events.length; i++) {
      const entry = events[i];
      const formattedStartTime = new Date(entry.fixture.timestamp * 1000).toISOString();
      const formattedEndTime = new Date((entry.fixture.timestamp + 7200) * 1000).toISOString(); // 2 hrs later
      const newEvent = await insertEvent(authClient, newCalendar.data.id, {
        title: `${entry.teams.home.name} vs ${entry.teams.away.name} | ${entry.league.name}`,
        description: `${entry.league.name} - ${entry.league.season} Season\nRound: ${entry.league.round}\n${entry.teams.home.name} vs ${entry.teams.away.name}\n${entry.fixture.venue.name} - ${entry.fixture.venue.city}, ${entry.league.country}`,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        location: `${entry.fixture.venue.name}, ${entry.fixture.venue.city}`,
      });
    }

    const public_calendar_url = `https://calendar.google.com/calendar/embed?src=${newCalendar.data.id}&ctz=${timeZone}`;
    return public_calendar_url;
  } catch (error) {
    console.error('Error in testClient(): ', error);
    return false;
  }
}

/**
 * This function creates a new calendar with the given title and description.
 *
 * @param {OAuth2Client} authClient - The OAuth2 client to use to make API calls.
 * @param {Object} body - The object representing the calendar data to insert into requestBody.
 * @returns {Object} The newly created calendar. False is returned if an error occurs.
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
    return false;
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

module.exports = {
  createPlanner,
};
