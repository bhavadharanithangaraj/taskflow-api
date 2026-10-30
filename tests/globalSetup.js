// Runs once before all tests: creates the test database if it is missing and
// applies db/schema.sql to it. Uses the same Postgres server as development.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';
  const config = require('../src/config/env');
  const url = new URL(config.databaseUrl);
  const dbName = url.pathname.slice(1);
  const ssl = config.dbSsl ? { rejectUnauthorized: false } : false;

  // Connect to the built-in "postgres" database to be able to create ours.
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString(), ssl });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) await admin.query(`CREATE DATABASE "${dbName}"`);
  await admin.end();

  const client = new Client({ connectionString: config.databaseUrl, ssl });
  await client.connect();
  await client.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
  await client.end();
};
