// URLs for tasks, mounted at /api/tasks. `router.use(requireAuth)` protects
// every route below it, so all task endpoints need a valid JWT.
const { Router } = require('express');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/auth');
const {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuery,
  taskIdParams,
} = require('../validators/task.schema');
const controller = require('../controllers/task.controller');

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: listTasksQuery }), controller.list);
router.post('/', validate({ body: createTaskSchema }), controller.create);
router.get('/:id', validate({ params: taskIdParams }), controller.getById);
router.patch('/:id', validate({ params: taskIdParams, body: updateTaskSchema }), controller.update);
router.delete('/:id', validate({ params: taskIdParams }), controller.remove);

module.exports = router;
