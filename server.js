const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); //just in case this script is run directly
const app = express();
const port = process.env.PORT || 3001;

const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

mongoose.connect(MONGODB_URI);

// import routes
const testRoute = require('./routes/test');
const leaguesRoute = require('./routes/leagues');
const countriesRoute = require('./routes/countries');
const planRoute = require('./routes/plan');
const { authRoute, callbackRoute } = require('./routes/auth');

app.use('/test', testRoute);
app.use('/leagues', leaguesRoute);
app.use('/countries', countriesRoute);
app.use('/plan', planRoute);
app.use('/auth', authRoute);
app.use('/authCallback', callbackRoute);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
