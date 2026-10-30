// Business logic for tasks. Every query includes `user_id = $n`, so a user can
// only ever see or change their own tasks; someone else's task simply looks
// like "not found" (404), which doesn't reveal that it exists.
const db = require('../db/pool');
const AppError = require('../utils/AppError');

// API field name -> database column name, used when building UPDATE statements.
const COLUMNS = { title: 'title', description: 'description', status: 'status', dueDate: 'due_date' };

function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function list(userId, { status, page, limit }) {
  const where = ['user_id = $1'];
  const params = [userId];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  const whereSql = where.join(' AND ');

  const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM tasks WHERE ${whereSql}`, params);
  const total = countResult.rows[0].total;

  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT * FROM tasks WHERE ${whereSql}
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  return {
    data: rows.map(toTask),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getById(userId, id) {
  const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!rows[0]) throw AppError.notFound('Task not found');
  return toTask(rows[0]);
}

async function create(userId, { title, description = null, status, dueDate = null }) {
  const { rows } = await db.query(
    `INSERT INTO tasks (user_id, title, description, status, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, title, description, status, dueDate],
  );
  return toTask(rows[0]);
}

async function update(userId, id, changes) {
  // Only fields that were sent are updated, e.g. { status: 'done' } -> SET status = $1
  const sets = [];
  const params = [];
  for (const [field, value] of Object.entries(changes)) {
    params.push(value);
    sets.push(`${COLUMNS[field]} = $${params.length}`);
  }
  params.push(id, userId);

  const { rows } = await db.query(
    `UPDATE tasks SET ${sets.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length - 1} AND user_id = $${params.length}
     RETURNING *`,
    params,
  );
  if (!rows[0]) throw AppError.notFound('Task not found');
  return toTask(rows[0]);
}

async function remove(userId, id) {
  const result = await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
  if (result.rowCount === 0) throw AppError.notFound('Task not found');
}

module.exports = { list, getById, create, update, remove };
