// URLs for authentication, mounted at /api/auth.
const { Router } = require('express');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validators/auth.schema');
const controller = require('../controllers/auth.controller');

const router = Router();

router.post('/register', validate({ body: registerSchema }), controller.register);
router.post('/login', validate({ body: loginSchema }), controller.login);
router.get('/me', requireAuth, controller.me);

module.exports = router;
