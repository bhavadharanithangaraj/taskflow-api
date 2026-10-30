// One task card. Status can be changed straight from the dropdown (a PATCH
// with just { status }); "Edit" swaps the card for a TaskForm.
import { useState } from 'react';
import TaskForm from './TaskForm';
import { STATUS_LABELS } from './statuses';

function formatDate(isoDate) {
  // "2026-11-05" -> "5 Nov 2026" (parsed as a plain date, so no time-zone shift)
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(task) {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  return task.dueDate && task.status !== 'done' && task.dueDate < today;
}

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="card task editing">
        <TaskForm
          initial={task}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(task.id, values);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className={`card task status-${task.status}`}>
      <div className="task-main">
        <h3 className={task.status === 'done' ? 'done' : ''}>{task.title}</h3>
        {task.description && <p className="muted">{task.description}</p>}
        {task.dueDate && (
          <p className={`due ${isOverdue(task) ? 'overdue' : ''}`}>
            {isOverdue(task) ? 'Overdue · ' : 'Due '}
            {formatDate(task.dueDate)}
          </p>
        )}
      </div>
      <div className="task-side">
        <select
          aria-label="Status"
          className={`pill status-${task.status}`}
          value={task.status}
          onChange={(e) => onUpdate(task.id, { status: e.target.value })}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className="row">
          <button className="btn ghost small" onClick={() => setEditing(true)}>Edit</button>
          <button
            className="btn danger small"
            onClick={() => window.confirm(`Delete "${task.title}"?`) && onDelete(task.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
