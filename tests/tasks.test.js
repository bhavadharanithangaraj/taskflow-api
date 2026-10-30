// API tests for /api/tasks: auth guard, CRUD, validation, filtering,
// pagination and making sure users can't touch each other's tasks.
const request = require('supertest');
const { app, pool, resetDb, registerUser } = require('./helpers');

let token;
const auth = () => ({ Authorization: `Bearer ${token}` });
const createTask = (body) => request(app).post('/api/tasks').set(auth()).send(body);

beforeEach(async () => {
  await resetDb();
  ({ token } = await registerUser());
});
afterAll(() => pool.end());

it('rejects requests without a token (401)', async () => {
  const res = await request(app).get('/api/tasks');
  expect(res.status).toBe(401);
  expect(res.body.error.code).toBe('UNAUTHORIZED');
});

it('creates a task with default status "todo"', async () => {
  const res = await createTask({ title: 'Write README', description: 'Endpoint table', dueDate: '2026-11-05' });

  expect(res.status).toBe(201);
  expect(res.body).toMatchObject({
    id: expect.any(Number),
    title: 'Write README',
    description: 'Endpoint table',
    status: 'todo',
    dueDate: '2026-11-05',
  });
});

it('validates the task body (400)', async () => {
  const res = await createTask({ title: '', status: 'later', dueDate: 'next friday' });

  expect(res.status).toBe(400);
  const fields = res.body.error.details.map((d) => d.field);
  expect(fields).toEqual(expect.arrayContaining(['title', 'status', 'dueDate']));
});

it('lists tasks with status filter and pagination', async () => {
  await createTask({ title: 'A', status: 'todo' });
  await createTask({ title: 'B', status: 'done' });
  await createTask({ title: 'C', status: 'done' });

  const done = await request(app).get('/api/tasks?status=done').set(auth());
  expect(done.status).toBe(200);
  expect(done.body.data.map((t) => t.title)).toEqual(['C', 'B']); // newest first
  expect(done.body.pagination).toEqual({ page: 1, limit: 10, total: 2, totalPages: 1 });

  const page2 = await request(app).get('/api/tasks?page=2&limit=2').set(auth());
  expect(page2.body.data.map((t) => t.title)).toEqual(['A']);
  expect(page2.body.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
});

it('updates only the fields sent (PATCH)', async () => {
  const { body: task } = await createTask({ title: 'Ship it', description: 'keep me' });

  const res = await request(app).patch(`/api/tasks/${task.id}`).set(auth()).send({ status: 'in_progress' });

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ title: 'Ship it', description: 'keep me', status: 'in_progress' });
});

it('deletes a task (204) and then returns 404 for it', async () => {
  const { body: task } = await createTask({ title: 'Temporary' });

  const del = await request(app).delete(`/api/tasks/${task.id}`).set(auth());
  expect(del.status).toBe(204);

  const get = await request(app).get(`/api/tasks/${task.id}`).set(auth());
  expect(get.status).toBe(404);
});

it("hides other users' tasks (404) and rejects invalid ids (400)", async () => {
  const { body: task } = await createTask({ title: 'Private' });
  const other = await registerUser('other@test.com');

  const res = await request(app).get(`/api/tasks/${task.id}`).set('Authorization', `Bearer ${other.token}`);
  expect(res.status).toBe(404);

  const bad = await request(app).get('/api/tasks/abc').set(auth());
  expect(bad.status).toBe(400);
});
