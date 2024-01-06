const express = require('express');
const authRouter = express.Router();
const callbackRouter = express.Router();
const { google } = require('googleapis');
const { updateUser } = require('../scripts/modUser.js'); //use createNewUser or updateUser based on if user exists or not

const credentials = require('../client_secret.json');

// create an OAuth2 client
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0], { expires_in: 9000 });

// set the OAuth2 client to be used for all API calls
authRouter.get('/', (_, res) => {
  // redirect users to Google's OAuth2 consent screen
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  });
  res.redirect(authUrl);
});

// callback route for Google to redirect to
callbackRouter.get('/', async (req, res) => {
  try {
    const code = req.query.code;

    // exchange the auth code for tokens
    const { tokens } = await oAuth2Client.getToken(code);

    if (!tokens.refresh_token) throw new Error('No refresh token found.');
    updateUser(1, 'root', tokens.refresh_token); //update refresh token in database
    oAuth2Client.setCredentials(tokens); //set credentials for OAuth2 client

    res.send({ 'Authentication successful!': tokens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  }
});

module.exports = {
  authRoute: authRouter,
  callbackRoute: callbackRouter,
};
