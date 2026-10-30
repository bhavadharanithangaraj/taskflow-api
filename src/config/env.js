// Loads settings from the .env file (or real environment variables) in one place,
// so the rest of the code reads `config.port` instead of `process.env.PORT` everywhere.
require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';

// Tests use their own database so they can wipe tables without touching your data.
const databaseUrl =
  nodeEnv === 'test'
    ? process.env.TEST_DATABASE_URL || 'postgres://taskflow:taskflow@localhost:5434/taskflow_test'
    : process.env.DATABASE_URL || 'postgres://taskflow:taskflow@localhost:5434/taskflow';

const jwtSecret = process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const config = {
  nodeEnv,
  port: Number(process.env.PORT) || 3000,
  databaseUrl,
  dbSsl: process.env.DB_SSL === 'true',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // Which websites may call the API from a browser. "*" = any (fine locally);
  // in production set it to the frontend URL, comma-separated for several.
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
