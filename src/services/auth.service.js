// Business logic for accounts: hashing passwords with bcrypt, checking
// credentials, and issuing JWTs. It knows nothing about HTTP (req/res),
// which keeps it easy to read and to test.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/pool');
const config = require('../config/env');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 10;

function toUser(row) {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

function signToken(user) {
  return jwt.sign({ sub: String(user.id), email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

async function register({ name, email, password }) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) throw AppError.conflict('Email is already registered');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash],
  );

  const user = toUser(rows[0]);
  return { user, token: signToken(user) };
}

async function login({ email, password }) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const row = rows[0];

  // Same message for "no such email" and "wrong password", so attackers
  // cannot find out which emails are registered.
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const user = toUser(row);
  return { user, token: signToken(user) };
}

async function getById(id) {
  const { rows } = await db.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id]);
  if (!rows[0]) throw AppError.notFound('User not found');
  return toUser(rows[0]);
}

module.exports = { register, login, getById };
