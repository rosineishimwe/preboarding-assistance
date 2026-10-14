const palette = {
  Pending: 'warning',
  'In Progress': 'info',
  Completed: 'success',
  Cancelled: 'danger',
};

export default function StatusBadge({ status }) {
  const type = palette[status] || 'info';
  return <span className={`status-badge ${type}`}>{status}</span>;
}
