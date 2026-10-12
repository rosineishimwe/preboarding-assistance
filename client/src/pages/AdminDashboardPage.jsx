import { useEffect, useState } from 'react';
import { BarChart3, BriefcaseBusiness, Users } from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState({ userStats: {}, requestStats: {}, feedback: [], users: [] });
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    const [adminData, requestData] = await Promise.all([
      api('/dashboard/admin'),
      api('/requests?status=all'),
    ]);
    setDashboard(adminData);
    setRequests(requestData.requests || []);
  };

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  const handleStatusChange = async (requestId, status) => {
    try {
      await api(`/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMessage('Request status updated successfully.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to update request status.');
    }
  };

  const handleUserAccessUpdate = async (userId, role, isActive) => {
    try {
      const response = await api(`/dashboard/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role, is_active: isActive }),
      });
      setMessage(response.message || 'User access updated successfully.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to update user access.');
    }
  };

  return (
    <div className="container dashboard-shell">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Administrator dashboard</p>
          <h1>System overview and operational control</h1>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard label="Passengers" value={dashboard.userStats.passengers || 0} icon={Users} />
        <StatCard label="Staff" value={dashboard.userStats.staff || 0} icon={BriefcaseBusiness} />
        <StatCard label="Total requests" value={dashboard.requestStats.total_requests || 0} icon={BarChart3} />
        <StatCard label="Completed" value={dashboard.requestStats.completed_requests || 0} icon={BarChart3} />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Feedback and reports</h2>
          {(dashboard.feedback || []).length ? (
            <ul className="list-plain">
              {dashboard.feedback.map((item) => (
                <li key={item.id}>
                  <strong>{item.full_name}</strong> rated {item.rating}/5 - {item.comments || 'No extra comments provided.'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No feedback submitted yet.</p>
          )}
        </section>

        <section className="panel">
          <h2>Operational summary</h2>
          <ul className="list-plain">
            <li>Pending requests: {dashboard.requestStats.pending_requests || 0}</li>
            <li>Cancelled requests: {dashboard.requestStats.cancelled_requests || 0}</li>
            <li>Completed requests: {dashboard.requestStats.completed_requests || 0}</li>
          </ul>
        </section>
      </div>

      <section className="panel requests-panel">
        <h2>Manage authorized staff accounts</h2>
        <div className="request-list plus-table">
          {(dashboard.users || []).map((user) => (
            <article key={user.id} className="request-card admin-request-card">
              <div className="request-header">
                <div>
                  <h3>{user.full_name}</h3>
                  <p>{user.email}</p>
                </div>
                <select
                  value={user.role}
                  onChange={(event) => handleUserAccessUpdate(user.id, event.target.value, user.is_active)}
                >
                  <option value="passenger">Passenger</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="meta-grid">
                <span>Phone: {user.phone || 'Not provided'}</span>
                <span>Status: {user.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="request-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleUserAccessUpdate(user.id, user.role, !user.is_active)}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel requests-panel">
        <h2>All assistance requests</h2>
        <div className="request-list plus-table">
          {requests.map((request) => (
            <article key={request.id} className="request-card admin-request-card">
              <div className="request-header">
                <div>
                  <h3>{request.passenger_name || 'Passenger'} • {request.departure_point} → {request.destination}</h3>
                  <p>Travel date: {request.travel_date}</p>
                </div>
                <select value={request.status} onChange={(event) => handleStatusChange(request.id, event.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Under review">Under review</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Staff assigned">Staff assigned</option>
                  <option value="Assistance completed">Assistance completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="meta-grid">
                <span>Type: {request.assistance_type}</span>
                <span>Contact: {request.preferred_contact_method}</span>
                <span>Assigned staff: {request.staff_name || 'Not assigned yet'}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
