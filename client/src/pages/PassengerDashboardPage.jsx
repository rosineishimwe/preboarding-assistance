import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Flag,
  MapPin,
  MessageSquareText,
  Send,
  ShieldCheck,
  Star,
} from 'lucide-react';
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

const statusOrder = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

const getRequestTimeline = (status) => {
  const currentIndex = statusOrder.indexOf(status);
  const isCancelled = status === 'Cancelled';

  return [
    { label: 'Submitted', active: true },
    { label: 'Reviewing', active: currentIndex >= 0 && !isCancelled },
    { label: 'In progress', active: currentIndex >= 1 && !isCancelled },
    { label: isCancelled ? 'Cancelled' : status === 'Completed' ? 'Completed' : 'Awaiting completion', active: true },
  ];
};

export default function PassengerDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({ stats: {}, requests: [], notifications: [] });
  const [form, setForm] = useState(emptyForm);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
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

  const filteredRequests = useMemo(() => {
    return (dashboard.requests || []).filter((request) => {
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [dashboard.requests, statusFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    if (!form.departure_point.trim()) {
      throw new Error('Departure point is required.');
    }
    if (!form.destination.trim()) {
      throw new Error('Destination is required.');
    }
    if (!form.travel_date) {
      throw new Error('Travel date is required.');
    }
    if (!form.preferred_departure_time) {
      throw new Error('Preferred departure time is required.');
    }
    if (!form.assistance_type) {
      throw new Error('Assistance type is required.');
    }
  };

  const handleSubmitRequest = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      validateForm();

      if (!reviewMode) {
        setReviewMode(true);
        return;
      }

      setIsSubmitting(true);
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
      setReviewMode(false);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Unable to save your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRequest = (request) => {
    setEditingRequestId(request.id);
    setReviewMode(false);
    setForm({
      departure_point: request.departure_point,
      destination: request.destination,
      travel_date: request.travel_date,
      preferred_departure_time: request.preferred_departure_time,
      assistance_type: request.assistance_type,
      additional_instructions: request.additional_instructions || '',
      preferred_contact_method: request.preferred_contact_method,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api(`/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      setMessage('Request cancelled successfully.');
      setReviewMode(false);
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
          <h1>{dashboard.welcome || `Welcome back, ${user?.full_name?.split(' ')[0] || 'traveller'}`}</h1>
        </div>
        <span className="header-badge">Secure NCPD access</span>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard label="Total requests" value={dashboard.stats.total_requests || 0} icon={ClipboardList} />
        <StatCard label="Pending" value={dashboard.stats.pending_requests || 0} icon={Clock3} />
        <StatCard label="In progress" value={dashboard.stats.in_progress_requests || 0} icon={Flag} />
        <StatCard label="Completed" value={dashboard.stats.completed_requests || 0} icon={Star} />
      </div>

      <div className="dashboard-grid">
        <section className="panel form-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow small">New assistance request</p>
              <h2>Request support before departure</h2>
            </div>
            <span className="section-pill">Private and secure</span>
          </div>

          <form className="request-form" onSubmit={handleSubmitRequest}>
            <div className="form-section">
              <div className="section-title-row">
                <MapPin size={18} />
                <h3>Trip details</h3>
              </div>
              <div className="field-grid">
                <label>
                  Departure point
                  <span className="field-required">Required</span>
                  <input name="departure_point" value={form.departure_point} onChange={handleChange} placeholder="e.g. Kigali International Airport" required />
                </label>
                <label>
                  Destination
                  <span className="field-required">Required</span>
                  <input name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Nairobi" required />
                </label>
                <label>
                  Travel date
                  <span className="field-required">Required</span>
                  <input type="date" name="travel_date" value={form.travel_date} onChange={handleChange} required />
                </label>
                <label>
                  Preferred departure time
                  <span className="field-required">Required</span>
                  <input type="time" name="preferred_departure_time" value={form.preferred_departure_time} onChange={handleChange} required />
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="section-title-row">
                <ShieldCheck size={18} />
                <h3>Support requirements</h3>
              </div>
              <div className="field-grid">
                <label>
                  Assistance type
                  <span className="field-required">Required</span>
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
                <label className="field-full-width">
                  Additional instructions
                  <textarea name="additional_instructions" rows="4" value={form.additional_instructions} onChange={handleChange} placeholder="Share any mobility needs, escort requirements, or timing preferences." />
                </label>
              </div>
            </div>

            {reviewMode && (
              <div className="review-panel">
                <div className="section-title-row">
                  <FileText size={18} />
                  <h3>Review before submission</h3>
                </div>
                <div className="review-grid">
                  <div className="review-item"><span>Departure</span><strong>{form.departure_point}</strong></div>
                  <div className="review-item"><span>Destination</span><strong>{form.destination}</strong></div>
                  <div className="review-item"><span>Travel date</span><strong>{form.travel_date}</strong></div>
                  <div className="review-item"><span>Departure time</span><strong>{form.preferred_departure_time}</strong></div>
                  <div className="review-item"><span>Assistance</span><strong>{form.assistance_type}</strong></div>
                  <div className="review-item"><span>Contact</span><strong>{form.preferred_contact_method}</strong></div>
                  <div className="review-item review-item-full"><span>Notes</span><strong>{form.additional_instructions || 'No additional instructions added.'}</strong></div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : reviewMode ? 'Confirm submission' : editingRequestId ? 'Review changes' : 'Review request'}
                {!isSubmitting && <ArrowRight size={16} />}
              </button>

              {editingRequestId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingRequestId(null);
                    setReviewMode(false);
                    setForm(emptyForm);
                  }}
                >
                  Cancel edit
                </button>
              )}

              {reviewMode && (
                <button type="button" className="btn btn-light" onClick={() => setReviewMode(false)}>
                  Edit details
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow small">Updates</p>
              <h2>Notifications</h2>
            </div>
          </div>
          <div className="notification-list">
            {(dashboard.notifications || []).length ? (
              dashboard.notifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                </div>
              ))
            ) : (
              <p className="empty-state">No notifications yet. We will share updates here when your request is reviewed.</p>
            )}
          </div>
        </section>
      </div>

      <section className="panel requests-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow small">Request history</p>
            <h2>Previous requests</h2>
          </div>
          <div className="request-toolbar-inline">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="request-list">
          {filteredRequests.length ? (
            filteredRequests.map((request) => (
              <article key={request.id} className="request-card">
                <div className="request-header">
                  <div>
                    <h3>{request.departure_point} → {request.destination}</h3>
                    <p>Reference: NCPD-{String(request.id).padStart(5, '0')}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="meta-grid">
                  <span><strong>Travel date:</strong> {request.travel_date}</span>
                  <span><strong>Departure:</strong> {request.preferred_departure_time}</span>
                  <span><strong>Assistance:</strong> {request.assistance_type}</span>
                  {request.staff_name && <span><strong>Assigned staff:</strong> {request.staff_name}</span>}
                </div>

                <div className="request-timeline" aria-label={`Status timeline for request ${request.departure_point}`}>
                  {getRequestTimeline(request.status).map(({ label, active }) => (
                    <span key={label} className={`timeline-step ${active ? 'active' : ''}`}>
                      {label}
                    </span>
                  ))}
                </div>

                {request.status !== 'Completed' && request.status !== 'Cancelled' && (
                  <div className="request-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => handleEditRequest(request)}>
                      Edit request
                    </button>
                    <button type="button" className="btn btn-light" onClick={() => handleCancelRequest(request.id)}>
                      Cancel request
                    </button>
                  </div>
                )}

                {request.status === 'Completed' && (
                  <div className="feedback-box">
                    <div className="feedback-header">
                      <MessageSquareText size={16} />
                      <span>Share your experience</span>
                    </div>
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
                      value={feedbackDrafts[request.id]?.comments || ''}
                      onChange={(event) =>
                        setFeedbackDrafts((current) => ({
                          ...current,
                          [request.id]: { ...((current[request.id] || {})), rating: current[request.id]?.rating || 5, comments: event.target.value },
                        }))
                      }
                      placeholder="Help us improve the assistance experience"
                    />
                    <button type="button" className="btn btn-primary" onClick={() => handleFeedback(request.id)}>
                      Submit feedback
                    </button>
                  </div>
                )}
              </article>
            ))
          ) : (
            <p className="empty-state">You have not submitted any matching requests yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
