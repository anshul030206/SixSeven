import React, { useState } from 'react';

const Login = ({ title, demoEmail, demoPassword, onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === demoEmail && password === demoPassword) {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'radial-gradient(circle at top right, var(--surface-light), var(--bg))'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.5s ease', position: 'relative' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ←
          </button>
        )}
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem', color: 'var(--accent)' }}>{title}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                outline: 'none'
              }}
              placeholder={demoEmail}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                outline: 'none'
              }}
              placeholder="•••••"
            />
          </div>

          {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Demo Credentials:</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span>Email: <code style={{ color: 'var(--accent)' }}>{demoEmail}</code></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            <span>Password: <code style={{ color: 'var(--accent)' }}>{demoPassword}</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
