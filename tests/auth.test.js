// API tests for /api/health and /api/auth (register, login, protected route).
const request = require('supertest');
const { app, pool, resetDb, registerUser } = require('./helpers');

beforeEach(resetDb);
afterAll(() => pool.end());

describe('GET /api/health', () => {
  it('reports the API and database as up', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });
});

describe('POST /api/auth/register', () => {
  it('creates a user, returns a token and never returns the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bhava', email: 'Bhava@Example.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ id: 1, name: 'Bhava', email: 'bhava@example.com' });
    expect(res.body.user).not.toHaveProperty('password_hash');

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = 1');
    expect(rows[0].password_hash).not.toBe('secret123');
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
  });

  it('rejects a duplicate email with 409', async () => {
    await registerUser('dup@test.com');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Again', email: 'dup@test.com', password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 400 with field details for invalid input', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ status: 400, code: 'BAD_REQUEST', message: 'Validation failed' });
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for correct credentials', async () => {
    await registerUser('login@test.com', 'secret123');
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('returns 401 for a wrong password', async () => {
    await registerUser('login@test.com', 'secret123');
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.com', password: 'wrong-pass' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token and 401 with a bad one', async () => {
    const { token } = await registerUser('me@test.com');

    const ok = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.email).toBe('me@test.com');

    const bad = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(bad.status).toBe(401);
  });
});
