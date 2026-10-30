// Loads settings from the .env file (or real environment variables) in one place,
// so the rest of the code reads `config.port` instead of `process.env.PORT` everywhere.
require('dotenv').config({ quiet: true });

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
};

module.exports = config;
