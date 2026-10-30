// The main router. Each feature (auth, tasks) gets its own router file and is
// mounted here under /api, so app.js stays short.
const { Router } = require('express');
const db = require('../db/pool');

const router = Router();

// Liveness check used by Docker and by you to confirm the API is up.
// It also pings the database, so "ok" means the whole stack works.
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'down' });
  }
});

router.use('/auth', require('./auth.routes'));

module.exports = router;
