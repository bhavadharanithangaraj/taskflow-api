// Rules for task requests: create/update bodies, the list query string
// (?status=&page=&limit=) and the :id URL parameter.
const { z } = require('zod');

const STATUSES = ['todo', 'in_progress', 'done'];

const status = z.enum(STATUSES, { error: `Status must be one of: ${STATUSES.join(', ')}` });
const title = z.string({ error: 'Title is required' }).trim().min(1, 'Title is required').max(200);
const description = z.string().trim().max(2000).nullable();
const dueDate = z.iso.date('Due date must be a date in YYYY-MM-DD format').nullable();

const createTaskSchema = z.object({
  title,
  description: description.optional(),
  status: status.default('todo'),
  dueDate: dueDate.optional(),
});

// PATCH: every field is optional, but at least one must be sent.
const updateTaskSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    status: status.optional(),
    dueDate: dueDate.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

const listTasksQuery = z.object({
  status: status.optional(),
  page: z.coerce.number().int().min(1, 'Page must be 1 or more').default(1),
  limit: z.coerce.number().int().min(1).max(100, 'Limit must be 100 or less').default(10),
});

const taskIdParams = z.object({
  // The max is Postgres's INTEGER limit, so huge ids get a 400 instead of a database error.
  id: z.coerce
    .number({ error: 'Task id must be a positive integer' })
    .int('Task id must be a positive integer')
    .positive('Task id must be a positive integer')
    .max(2147483647, 'Task id is too large'),
});

module.exports = { STATUSES, createTaskSchema, updateTaskSchema, listTasksQuery, taskIdParams };
