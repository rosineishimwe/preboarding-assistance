import { useEffect, useState } from 'react';
import { ClipboardList, Clock3, Flag, Send, Star } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

const emptyForm = {
  departure_point: '',
  destination: '',
  travel_date: '',
  preferred_departure_time: '',
  assistance_type: 'Wheelchair boarding support',
  additional_instructions: '',
  preferred_contact_method: 'phone',
};

export default function PassengerDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({ stats: {}, requests: [], notifications: [] });
  const [form, setForm] = useState(emptyForm);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDashboard = async () => {
    const result = await api('/dashboard/passenger');
    setDashboard(result);
  };

  useEffect(() => {
    loadDashboard().catch((err) => setError(err.message));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmitRequest = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const requestMethod = editingRequestId ? 'PATCH' : 'POST';
      const endpoint = editingRequestId ? `/requests/${editingRequestId}` : '/requests';
      const result = await api(endpoint, {
        method: requestMethod,
        body: JSON.stringify(form),
      });

      setMessage(
        editingRequestId
          ? 'Request updated successfully.'
          : `Request submitted successfully. Reference: ${result.reference_number}`
      );
      setForm(emptyForm);
      setEditingRequestId(null);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Unable to create request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRequest = (request) => {
    setEditingRequestId(request.id);
    setForm({
      departure_point: request.departure_point,
      destination: request.destination,
      travel_date: request.travel_date,
      preferred_departure_time: request.preferred_departure_time,
      assistance_type: request.assistance_type,
      additional_instructions: request.additional_instructions || '',
      preferred_contact_method: request.preferred_contact_method,
    });
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api(`/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      setMessage('Request cancelled successfully.');
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Unable to cancel request.');
    }
  };

  const handleFeedback = async (requestId) => {
    const draft = feedbackDrafts[requestId] || { rating: 5, comments: '' };
    try {
      await api(`/requests/${requestId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          rating: Number(draft.rating),
          comments: draft.comments,
        }),
      });
      setMessage('Feedback submitted successfully.');
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Unable to save feedback.');
    }
  };

  return (
    <div className="container dashboard-shell">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Passenger dashboard</p>
          <h1>{dashboard.welcome || 'Welcome back'}</h1>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard label="Total requests" value={dashboard.stats.total_requests || 0} icon={ClipboardList} />
        <StatCard label="Pending" value={dashboard.stats.pending_requests || 0} icon={Clock3} />
        <StatCard label="Accepted" value={dashboard.stats.accepted_requests || 0} icon={Flag} />
        <StatCard label="Completed" value={dashboard.stats.completed_requests || 0} icon={Star} />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>New assistance request</h2>
          <form className="form-grid" onSubmit={handleSubmitRequest}>
            <label>
              Departure point
              <input name="departure_point" value={form.departure_point} onChange={handleChange} required />
            </label>
            <label>
              Destination
              <input name="destination" value={form.destination} onChange={handleChange} required />
            </label>
            <label>
              Travel date
              <input type="date" name="travel_date" value={form.travel_date} onChange={handleChange} required />
            </label>
            <label>
              Preferred departure time
              <input type="time" name="preferred_departure_time" value={form.preferred_departure_time} onChange={handleChange} required />
            </label>
            <label>
              Assistance type
              <select name="assistance_type" value={form.assistance_type} onChange={handleChange}>
                <option>Wheelchair boarding support</option>
                <option>Visual guidance</option>
                <option>Hearing or communication support</option>
                <option>Mobility assistance</option>
                <option>Station or boarding-point guidance</option>
                <option>Other assistance</option>
              </select>
            </label>
            <label>
              Preferred contact method
              <select name="preferred_contact_method" value={form.preferred_contact_method} onChange={handleChange}>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>
            <label className="full-width">
              Additional instructions
              <textarea name="additional_instructions" rows="4" value={form.additional_instructions} onChange={handleChange} />
            </label>

            <button type="submit" className="btn btn-primary full-width" disabled={isSubmitting}>
              <Send size={16} />
              {isSubmitting ? (editingRequestId ? 'Updating...' : 'Submitting...') : editingRequestId ? 'Update request' : 'Submit request'}
            </button>
            {editingRequestId && (
              <button
                type="button"
                className="btn btn-secondary full-width"
                onClick={() => {
                  setEditingRequestId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel edit
              </button>
            )}
          </form>
        </section>

        <section className="panel">
          <h2>Notifications</h2>
          <div className="notification-list">
            {(dashboard.notifications || []).length ? (
              dashboard.notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                </div>
              ))
            ) : (
              <p className="empty-state">No notifications yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="panel requests-panel">
        <h2>Previous requests</h2>
        <div className="request-list">
          {(dashboard.requests || []).length ? (
            dashboard.requests.map((request) => (
              <article key={request.id} className="request-card">
                <div className="request-header">
                  <div>
                    <h3>{request.departure_point} → {request.destination}</h3>
                    <p>Reference: NCPD-{String(request.id).padStart(5, '0')}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="meta-grid">
                  <span>Travel date: {request.travel_date}</span>
                  <span>Departure: {request.preferred_departure_time}</span>
                  <span>Assistance type: {request.assistance_type}</span>
                  {request.staff_name && <span>Assigned staff: {request.staff_name}</span>}
                </div>

                {request.status !== 'Assistance completed' && request.status !== 'Cancelled' && (
                  <div className="request-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => handleEditRequest(request)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-light" onClick={() => handleCancelRequest(request.id)}>
                      Cancel request
                    </button>
                  </div>
                )}

                {request.status === 'Assistance completed' && (
                  <div className="feedback-box">
                    <select
                      value={feedbackDrafts[request.id]?.rating || 5}
                      onChange={(event) =>
                        setFeedbackDrafts((current) => ({
                          ...current,
                          [request.id]: { ...((current[request.id] || {})), rating: event.target.value, comments: current[request.id]?.comments || '' },
                        }))
                      }
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Fair</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Very poor</option>
                    </select>
                    <textarea
                      rows="3"
                      placeholder="Optional comments"
                      value={feedbackDrafts[request.id]?.comments || ''}
                      onChange={(event) =>
                        setFeedbackDrafts((current) => ({
                          ...current,
                          [request.id]: { ...((current[request.id] || {})), rating: current[request.id]?.rating || 5, comments: event.target.value },
                        }))
                      }
                    />
                    <button type="button" className="btn btn-secondary" onClick={() => handleFeedback(request.id)}>
                      Submit feedback
                    </button>
                  </div>
                )}
              </article>
            ))
          ) : (
            <p className="empty-state">You have not submitted any assistance requests.</p>
          )}
        </div>
      </section>
    </div>
  );
}
