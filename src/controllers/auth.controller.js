// Controllers translate HTTP into service calls: take the validated input,
// call the service, and send the right status code. Express 5 forwards any
// thrown/rejected error to the error middleware automatically.
const authService = require('../services/auth.service');

async function register(req, res) {
  const result = await authService.register(req.valid.body);
  res.status(201).json(result);
}

async function login(req, res) {
  const result = await authService.login(req.valid.body);
  res.json(result);
}

async function me(req, res) {
  const user = await authService.getById(req.user.id);
  res.json(user);
}

module.exports = { register, login, me };
