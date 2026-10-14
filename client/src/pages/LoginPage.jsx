import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ email: '', password: '' });
  }, []);

  if (user) {
    const destination = user.role === 'passenger' ? '/dashboard/passenger' : user.role === 'staff' ? '/dashboard/staff' : '/dashboard/admin';
    return <Navigate to={destination} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(form);
      const destination = result.user.role === 'passenger' ? '/dashboard/passenger' : result.user.role === 'staff' ? '/dashboard/staff' : '/dashboard/admin';
      navigate(destination);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-shell">
      <section className="auth-card">
        <h1>Passenger login</h1>
        <p>Please sign in to manage your assistance request.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="form-stack" onSubmit={handleSubmit} autoComplete="on">
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="current-password" />
          </label>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footnote">
          Need an account? <a href="/register">Create one here</a>
        </div>
      </section>
    </div>
  );
}
