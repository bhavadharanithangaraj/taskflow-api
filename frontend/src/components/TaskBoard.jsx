// The main screen after login. It keeps the current filter and page in state,
// asks the API for that page (GET /tasks?status=&page=&limit=), and reloads
// after every create, update or delete so the counts and pages stay correct.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import { STATUS_LABELS } from './statuses';

const PAGE_SIZE = 5;
const FILTERS = [['', 'All'], ...Object.entries(STATUS_LABELS)];

export default function TaskBoard({ onUnauthorized }) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Any 401 means the token expired: log out instead of showing an error.
  const handle = useCallback(
    (err) => {
      if (err.status === 401) onUnauthorized();
      else setError(err.message);
    },
    [onUnauthorized],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.listTasks({ status, page, limit: PAGE_SIZE });
      // Deleting the last task on a page leaves it empty: step back one page.
      if (res.data.length === 0 && page > 1) setPage(page - 1);
      else setResult(res);
    } catch (err) {
      handle(err);
    } finally {
      setLoading(false);
    }
  }, [status, page, handle]);

  useEffect(() => {
    load();
  }, [load]);

  function changeFilter(value) {
    setStatus(value);
    setPage(1);
  }

  async function createTask(values) {
    await api.createTask(values);
    if (page === 1) await load();
    else setPage(1); // newest tasks are on page 1
  }

  async function updateTask(id, values) {
    try {
      await api.updateTask(id, values);
      await load();
    } catch (err) {
      if (err.details?.length) throw err; // let the edit form show field errors
      handle(err);
    }
  }

  async function deleteTask(id) {
    try {
      await api.deleteTask(id);
      await load();
    } catch (err) {
      handle(err);
    }
  }

  const { data: tasks, pagination } = result;

  return (
    <div className="board">
      <section className="card">
        <h2>New task</h2>
        <TaskForm onSubmit={createTask} />
      </section>

      <section>
        <div className="board-head">
          <h2>
            Your tasks <span className="muted count">({pagination.total})</span>
          </h2>
          <div className="filters" role="group" aria-label="Filter by status">
            {FILTERS.map(([value, label]) => (
              <button
                key={value || 'all'}
                className={`chip ${status === value ? 'active' : ''}`}
                aria-pressed={status === value}
                onClick={() => changeFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="alert">{error}</p>}

        {loading && tasks.length === 0 ? (
          <p className="muted center">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="empty card muted">
            {status ? `No "${STATUS_LABELS[status]}" tasks.` : 'No tasks yet. Add your first one above.'}
          </p>
        ) : (
          <ul className={`tasks ${loading ? 'faded' : ''}`}>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
            ))}
          </ul>
        )}

        {pagination.totalPages > 1 && (
          <nav className="pager" aria-label="Pagination">
            <button className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Previous
            </button>
            <span className="muted">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              className="btn ghost small"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next →
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
