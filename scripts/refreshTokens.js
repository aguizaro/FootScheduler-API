const mongoose = require('mongoose');
const User = require('../models/User');
const { getUser, updateUser } = require('../scripts/modUser');

const { OAuth2Client } = require('google-auth-library');
const credentials = require('../client_secret.json');
const { client_secret, client_id } = credentials.web;
const oAuth2Client = new OAuth2Client(client_id, client_secret);

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Refresh the access for the given user ID. Requires that the current stored refresh token is valid.
 * @param {number} userID - The user ID to refresh the access for
 */
async function refreshAccess(userID) {
  try {
    // wait for getUser to resolve before proceeding
    const user = await getUser(userID);

    const storedToken = user?.refreshToken;
    if (!storedToken) throw new Error('Current token not found');

    // set the stored refresh token on the OAuth2 client
    oAuth2Client.setCredentials({ refresh_token: storedToken });

    // use refresh token to obtain a new access token
    const tokens = await oAuth2Client.refreshAccessToken();

    // Store the new refresh token for future use
    await updateUser(userID, 'fresh user', tokens.refresh_token);

    // set new refresh token to OAuth2Client
    oAuth2Client.setCredentials(tokens);
  } catch (error) {
    console.error('Error in refreshAccess(): ', error);
  }
}
//----------------------------------Main----------------------------------

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    await refreshAccess(1);
  } finally {
    mongoose.disconnect();
  }
}

main();
