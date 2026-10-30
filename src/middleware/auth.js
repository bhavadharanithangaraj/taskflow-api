// JWT guard for protected routes. It expects the header
//   Authorization: Bearer <token>
// verifies the token's signature and expiry, and puts the user on `req.user`.
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: Number(payload.sub), email: payload.email };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

module.exports = requireAuth;
