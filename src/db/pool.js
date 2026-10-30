// One shared connection pool for the whole app. A pool keeps a few open
// connections to Postgres and reuses them, which is much faster than
// connecting on every request. Services call `db.query(sql, params)`.
const { Pool } = require('pg');
const config = require('../config/env');

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
