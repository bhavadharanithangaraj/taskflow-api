// The main router. Each feature (auth, tasks) gets its own router file and is
// mounted here under /api, so app.js stays short.
const { Router } = require('express');

const router = Router();

// Simple liveness check used by Docker and by you to confirm the API is up.
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
