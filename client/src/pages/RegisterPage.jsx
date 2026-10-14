import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const defaultForm = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  preferred_contact_method: 'phone',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ ...defaultForm });
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await register(form);
      navigate('/dashboard/passenger');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-shell">
      <section className="auth-card large-card">
        <h1>Create passenger account</h1>
        <p>Register to request pre-boarding support before your trip.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="form-grid" onSubmit={handleSubmit} autoComplete="on">
          <label>
            Full name
            <input name="full_name" value={form.full_name} onChange={handleChange} required autoComplete="name" />
          </label>
          <label>
            Email address
            <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" />
          </label>
          <label>
            Phone number
            <input name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" />
          </label>
          <label>
            Preferred contact method
            <select name="preferred_contact_method" value={form.preferred_contact_method} onChange={handleChange} autoComplete="off">
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          <label className="full-width">
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" />
          </label>

          <button type="submit" className="btn btn-primary full-width" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
      </section>
    </div>
  );
}
