const mongoose = require('mongoose');

// define the schema for the User entity
const userSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  refreshToken: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
