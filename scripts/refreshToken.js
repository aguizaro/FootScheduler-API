const mongoose = require('mongoose');
const { getUser, updateUser } = require('./modUser');
const { OAuth2Client } = require('google-auth-library');

const credentials = require('../client_secret.json');
const { client_secret, client_id } = credentials.web;
const oAuth2Client = new OAuth2Client(client_id, client_secret);

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI);

/**
 * Refresh the access for the given user ID. Requires that the current stored refresh token is valid. This function will update the stored refresh token for the user in the database.
 * @param {number} userID - The user ID to refresh the access for
 * @returns {OAuth2Client | null} The OAuth2 client with the new access token set. This client can be used to make API calls. Null is returned if the refresh token is invalid.
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
    const response = await oAuth2Client.refreshAccessToken();
    if (response.res.status !== 200) throw new Error('RefreshAccessToken failed: ', response.res.statusText);

    // store the new refresh token for future use
    await updateUser(userID, 'root user', response.credentials.refresh_token);

    // set cline credentials to the new access token and return the OAuth2 client
    oAuth2Client.setCredentials(response.credentials);
    return oAuth2Client;
  } catch (error) {
    console.error('Error in refreshAccess(): ', error);
    return null;
  }
}

module.exports = {
  refreshAccess,
};
