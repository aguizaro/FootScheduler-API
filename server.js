const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3001;

const MONGODB_URI = 'mongodb://127.0.0.1:27017/footscheduler';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGODB_URI);

// import routes
const testRoute = require('./routes/test');
const leaguesRoute = require('./routes/leagues');
const countriesRoute = require('./routes/countries');

app.use('/test', testRoute);
app.use('/leagues', leaguesRoute);
app.use('/countries', countriesRoute);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
