import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { CheckCircle2, ClipboardList, ListFilter, TimerReset } from 'lucide-react';

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({ stats: {}, requests: [], upcoming: [] });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    const result = await api('/dashboard/staff');
    setDashboard(result);
  };

  useEffect(() => {
    loadDashboard().catch((err) => setError(err.message));
  }, []);

  const filteredRequests = (dashboard.requests || []).filter((request) => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch =
      !search ||
      `${request.passenger_name || ''} ${request.destination || ''} ${request.departure_point || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAssign = async (requestId) => {
    try {
      await api(`/requests/${requestId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ staff_id: user.id }),
      });
      setMessage('Request assigned to you successfully.');
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Unable to assign staff.');
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await api(`/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMessage(`Request status updated to ${status}.`);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Unable to update request status.');
    }
  };

  return (
    <div className="container dashboard-shell">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Staff operations</p>
          <h1>Review and coordinate assistance</h1>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <StatCard label="Total requests" value={dashboard.stats.total_requests || 0} icon={ClipboardList} />
        <StatCard label="Pending" value={dashboard.stats.pending_requests || 0} icon={TimerReset} />
        <StatCard label="In progress" value={dashboard.stats.in_progress_requests || 0} icon={ListFilter} />
        <StatCard label="Completed" value={dashboard.stats.completed_requests || 0} icon={CheckCircle2} />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Search and filter</h2>
          <div className="toolbar-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or destination"
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </section>

        <section className="panel">
          <h2>Upcoming journeys</h2>
          {(dashboard.upcoming || []).length ? (
            <ul className="list-plain">
              {dashboard.upcoming.map((item) => (
                <li key={item.id}>
                  <strong>{item.departure_point}</strong> → {item.destination} on {item.travel_date}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No upcoming journeys scheduled.</p>
          )}
        </section>
      </div>

      <section className="panel requests-panel">
        <h2>Assigned requests</h2>
        <div className="request-list">
          {filteredRequests.length ? (
            filteredRequests.map((request) => (
              <article key={request.id} className="request-card">
                <div className="request-header">
                  <div>
                    <h3>{request.passenger_name || 'Passenger'} • {request.departure_point} → {request.destination}</h3>
                    <p>Travel date: {request.travel_date}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="meta-grid">
                  <span>Passenger: {request.passenger_name}</span>
                  <span>Email: {request.passenger_email || 'Not provided'}</span>
                  <span>Phone: {request.passenger_phone || 'Not provided'}</span>
                  <span>Assistance: {request.assistance_type}</span>
                  <span>Departure: {request.preferred_departure_time}</span>
                  <span>Preferred contact: {request.preferred_contact_method}</span>
                </div>

                <p><strong>Request details:</strong> {request.additional_instructions || 'No extra instructions listed.'}</p>

                <div className="request-actions">
                  <select value={request.status} onChange={(event) => handleStatusUpdate(request.id, event.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  {request.assigned_staff_id !== user.id && (
                    <button type="button" className="btn btn-secondary" onClick={() => handleAssign(request.id)}>
                      Assign to me
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">No requests match the selected filters.</p>
          )}
        </div>
      </section>
    </div>
  );
}
