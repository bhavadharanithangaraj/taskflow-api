// Entry point: starts the HTTP server on the configured port.
// `npm start` runs this file; tests never do.
const app = require('./app');
const config = require('./config/env');

app.listen(config.port, () => {
  console.log(`TaskFlow API listening on http://localhost:${config.port} (${config.nodeEnv})`);
});
