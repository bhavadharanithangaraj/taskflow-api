// Builds the Express app (middleware + routes + error handling) WITHOUT starting
// the server. Keeping this separate from server.js lets Supertest import the app
// in tests and send requests to it without opening a real port.
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

// These two must come last: first "no route matched", then "format any error".
app.use(notFound);
app.use(errorHandler);

module.exports = app;
