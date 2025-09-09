// frontend/src/api/axios.js
import axios from 'axios';

const inferBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname === 'localhost' && (port === '3000' || port === '5173')) {
      return 'http://localhost:5000/api';
    }
    // Default to same-origin api path
    return '/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: inferBaseUrl(),
  withCredentials: true, // only if backend uses cookies
});

// Attach Authorization header from stored access token
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

export default api;
