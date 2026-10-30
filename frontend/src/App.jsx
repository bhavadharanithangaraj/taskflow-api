// Top-level component: decides between the login screen and the task board.
// On first load it checks a saved token with GET /auth/me, so a page refresh
// keeps you logged in, and an expired token sends you back to login.
import { useEffect, useState } from 'react';
import { api, tokenStore } from './api';
import AuthForm from './components/AuthForm';
import TaskBoard from './components/TaskBoard';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

  function handleAuth({ user, token }) {
    tokenStore.set(token);
    setUser(user);
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  if (checking) return <p className="center muted">Loading…</p>;

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">
          <span className="logo" aria-hidden="true">✓</span> TaskFlow
        </h1>
        {user && (
          <div className="user">
            <span className="muted">Hi, {user.name}</span>
            <button className="btn ghost" onClick={logout}>Log out</button>
          </div>
        )}
      </header>
      <main>{user ? <TaskBoard onUnauthorized={logout} /> : <AuthForm onAuth={handleAuth} />}</main>
      <footer className="footer muted">
        React + Vite frontend for a Node.js / Express / PostgreSQL REST API
      </footer>
    </div>
  );
}
