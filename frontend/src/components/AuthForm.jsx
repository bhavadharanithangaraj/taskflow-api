// Login and register in one form, switched with two tabs. Validation errors
// from the API (e.g. "Password must be at least 8 characters") appear under
// the matching input; other errors (wrong password, email taken) at the top.
import { useState } from 'react';
import { api } from '../api';

const EMPTY = { name: '', email: '', password: '' };

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setMessage('');
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage('');
    try {
      const result = isRegister
        ? await api.register(form)
        : await api.login({ email: form.email, password: form.password });
      onAuth(result);
    } catch (err) {
      setErrors(err.fieldErrors?.() ?? {});
      setMessage(err.details?.length ? '' : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={!isRegister} className={!isRegister ? 'active' : ''} onClick={() => switchMode('login')}>
          Log in
        </button>
        <button role="tab" aria-selected={isRegister} className={isRegister ? 'active' : ''} onClick={() => switchMode('register')}>
          Register
        </button>
      </div>

      <form onSubmit={submit} noValidate>
        {message && <p className="alert">{message}</p>}

        {isRegister && (
          <label>
            Name
            <input value={form.name} onChange={update('name')} autoComplete="name" />
            {errors.name && <small className="error">{errors.name}</small>}
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} autoComplete="email" />
          {errors.email && <small className="error">{errors.email}</small>}
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          {errors.password && <small className="error">{errors.password}</small>}
        </label>

        <button className="btn primary full" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>
      </form>
    </section>
  );
}
