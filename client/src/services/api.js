const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL || '';

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocalhost ? 'http://localhost:5000/api' : '';
};

const API_BASE_URL = resolveApiBaseUrl();

const api = async (endpoint, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error('The app is missing a live API URL. Configure VITE_API_BASE_URL with your deployed backend URL before opening the public site.');
  }

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? options.body : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : { message: await response.text() };

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export default api;
