import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Upload APIs
export const uploadAPI = {
  uploadResume: (formData) => {
    return api.post('/upload/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getResume: () => api.get('/upload/resume')
};

// Interview APIs
export const interviewAPI = {
  startInterview: (data) => api.post('/interview/start', data),
  submitAnswer: (interviewId, data) => api.post(`/interview/${interviewId}/answer`, data),
  completeInterview: (interviewId) => api.post(`/interview/${interviewId}/complete`),
  getInterview: (interviewId) => api.get(`/interview/${interviewId}`),
  getAllInterviews: () => api.get('/interview'),
  getDashboardStats: () => api.get('/interview/stats/dashboard')
};

export default api;
