// Form for creating a task, and (with `initial`) for editing one.
// It only collects values; the parent decides whether to POST or PATCH.
import { useState } from 'react';
import { STATUS_LABELS } from './statuses';

export default function TaskForm({ initial, onSubmit, onCancel, submitLabel = 'Add task' }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'todo',
    dueDate: initial?.dueDate ?? '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage('');
    try {
      // Empty inputs mean "no value", which the API expects as null.
      await onSubmit({
        title: form.title,
        description: form.description.trim() || null,
        status: form.status,
        dueDate: form.dueDate || null,
      });
      if (!initial) setForm({ title: '', description: '', status: 'todo', dueDate: '' });
    } catch (err) {
      setErrors(err.fieldErrors?.() ?? {});
      setMessage(err.details?.length ? '' : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="task-form" onSubmit={submit} noValidate>
      {message && <p className="alert">{message}</p>}
      <label className="span-2">
        Title
        <input value={form.title} onChange={update('title')} placeholder="What needs doing?" />
        {errors.title && <small className="error">{errors.title}</small>}
      </label>
      <label className="span-2">
        Description
        <textarea rows={2} value={form.description} onChange={update('description')} placeholder="Optional details" />
        {errors.description && <small className="error">{errors.description}</small>}
      </label>
      <label>
        Status
        <select value={form.status} onChange={update('status')}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Due date
        <input type="date" value={form.dueDate} onChange={update('dueDate')} />
        {errors.dueDate && <small className="error">{errors.dueDate}</small>}
      </label>
      <div className="actions span-2">
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
