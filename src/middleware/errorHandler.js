// Centralized error handling. Every error in the app ends up here, and every
// error response has the same shape:
//   { "error": { "status": 404, "code": "NOT_FOUND", "message": "...", "details": [...] } }
const AppError = require('../utils/AppError');

// Runs when no route matched the request.
function notFound(req, res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// Express recognises an error handler by its 4 arguments.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message;

  // Malformed JSON body sent by the client.
  if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  }

  // Never leak internal details (SQL errors, stack traces) to the client.
  if (status >= 500) {
    console.error(err);
    message = 'Something went wrong on the server';
  }

  const body = { status, code, message };
  if (err.details) body.details = err.details;

  res.status(status).json({ error: body });
}

module.exports = { notFound, errorHandler };
