const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI);

/**
 * Create a new user in the database with the given id, name, and refresh token
 * @param {number} id
 * @param {string} name
 * @param {string} refreshToken
 */
async function createNewUser(id, name, refreshToken) {
  try {
    const newUser = new User({
      id: id,
      name: name,
      refreshToken: refreshToken,
    });

    await newUser.save();
    console.log('User created successfully');
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

/**
 * Update a user in the database with the given ID and new refresh token
 * @param {number} id - The user ID to update.
 * @param {string} newToken - The new refresh token to update for the user.
 */
async function updateUser(id, name, newToken) {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { id: id },
      { $set: { name: name, refreshToken: newToken } },
      { new: true }, // return the updated document
    );

    if (updatedUser) {
      console.log('User updated successfully: ', updatedUser);
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

/**
 * Get a user from the database with the given ID
 * @param {number} id - The user ID to get.
 * @returns {object} The user object.
 */
async function getUser(id) {
  try {
    return await User.findOne({ id: id });
  } catch (error) {
    console.error('Error getting user:', error);
  }
}

module.exports = {
  createNewUser,
  updateUser,
  getUser,
};
