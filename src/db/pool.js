// One shared connection pool for the whole app. A pool keeps a few open
// connections to Postgres and reuses them, which is much faster than
// connecting on every request. Services call `db.query(sql, params)`.
const { Pool, types } = require('pg');
const config = require('../config/env');

// Return DATE columns as plain "YYYY-MM-DD" strings. By default pg turns them
// into JS Dates at local midnight, which can shift the day across time zones.
const DATE_OID = 1082;
types.setTypeParser(DATE_OID, (value) => value);

const pool = new Pool({
  connectionString: config.databaseUrl,
  // Cloud databases (Neon, Render) require SSL; local Docker does not.
  ssl: config.dbSsl ? { rejectUnauthorized: false } : false,
});

// `params` are sent separately from the SQL text ($1, $2 ...), which is what
// protects against SQL injection. Never build SQL by pasting user input in.
function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
