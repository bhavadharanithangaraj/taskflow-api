// Shared test helpers: wipe the tables between tests and create a logged-in user.
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db/pool');

async function resetDb() {
  await pool.query('TRUNCATE users, tasks RESTART IDENTITY CASCADE');
}

async function registerUser(email = 'user@test.com', password = 'secret123') {
  const res = await request(app).post('/api/auth/register').send({ name: 'Test User', email, password });
  return { token: res.body.token, user: res.body.user };
}

module.exports = { app, pool, resetDb, registerUser };
