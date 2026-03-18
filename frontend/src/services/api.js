// frontend/src/services/api.js

import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    
    // Format error message
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    return Promise.reject({
      ...error,
      message
    });
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  joinGroups: (groupIds) => api.post('/auth/join-groups', { groupIds }),
  leaveGroup: (groupId) => api.delete(`/auth/leave-group/${groupId}`)
};

// Groups API calls
export const groupsAPI = {
  getAll: () => api.get('/groups'),
  getById: (groupId) => api.get(`/groups/${groupId}`)
};

// Matches API calls
export const matchesAPI = {
  getAll: (params) => api.get('/matches', { params }),
  getById: (matchId) => api.get(`/matches/${matchId}`),
  getCompleted: (groupId) => api.get('/matches/completed', { params: { groupId } }),
  getPendingForAdmin: () => api.get('/matches/admin/pending'),
  create: (matchData) => api.post('/matches', matchData),
  update: (matchId, matchData) => api.put(`/matches/${matchId}`, matchData),
  delete: (matchId) => api.delete(`/matches/${matchId}`)
};

// Votes API calls
export const votesAPI = {
  castVote: (voteData) => api.post('/votes', voteData),
  getMyVote: (matchId) => api.get(`/votes/match/${matchId}`),
  getMatchVotes: (matchId) => api.get(`/votes/match/${matchId}/all`),
  cancelVote: (matchId) => api.delete(`/votes/match/${matchId}`)
};

// Points API calls
export const pointsAPI = {
  declareWinner: (matchId, winningTeam) => api.post(`/points/declare-winner/${matchId}`, { winningTeam }),
  getGroupPoints: (groupId) => api.get(`/points/group/${groupId}`),
  getMyGroupsPoints: () => api.get('/points/my-groups'),
  getMatchResults: (groupId) => api.get(`/points/match-results/${groupId}`),
  getGlobalLeaderboard: () => api.get('/points/global-leaderboard')
};

// Admin API calls
export const adminAPI = {
  // Groups
  createGroup: (groupData) => api.post('/admin/groups', groupData),
  getAllGroups: () => api.get('/admin/groups'),
  getGroupDetails: (groupId) => api.get(`/admin/groups/${groupId}`),
  updateGroup: (groupId, groupData) => api.put(`/admin/groups/${groupId}`, groupData),
  deleteGroup: (groupId) => api.delete(`/admin/groups/${groupId}`),
  addUserToGroup: (groupId, userId) => api.post(`/admin/groups/${groupId}/users`, { userId }),
  removeUserFromGroup: (groupId, userId) => api.delete(`/admin/groups/${groupId}/users/${userId}`),
  
  // Users
  getAllUsers: () => api.get('/admin/users')
};

// Tournament API calls
export const tournamentAPI = {
  start: () => api.post('/tournament/start'),
  end: () => api.post('/tournament/end'),
  reset: (confirm) => api.post('/tournament/reset', { confirm }),
  status: () => api.get('/tournament/status'),
  summary: () => api.get('/tournament/summary')
};

export default api;