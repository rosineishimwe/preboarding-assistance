const palette = {
  Pending: 'warning',
  'Under review': 'info',
  Accepted: 'success',
  'Staff assigned': 'primary',
  'Assistance completed': 'success',
  Cancelled: 'danger',
};

export default function StatusBadge({ status }) {
  const type = palette[status] || 'info';
  return <span className={`status-badge ${type}`}>{status}</span>;
}
