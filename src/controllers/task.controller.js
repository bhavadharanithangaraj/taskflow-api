// HTTP layer for tasks: reads the logged-in user (req.user) and the validated
// input (req.valid), calls the task service, and picks the status code.
const taskService = require('../services/task.service');

async function list(req, res) {
  res.json(await taskService.list(req.user.id, req.valid.query));
}

async function getById(req, res) {
  res.json(await taskService.getById(req.user.id, req.valid.params.id));
}

async function create(req, res) {
  const task = await taskService.create(req.user.id, req.valid.body);
  res.status(201).json(task);
}

async function update(req, res) {
  res.json(await taskService.update(req.user.id, req.valid.params.id, req.valid.body));
}

async function remove(req, res) {
  await taskService.remove(req.user.id, req.valid.params.id);
  res.status(204).end();
}

module.exports = { list, getById, create, update, remove };
