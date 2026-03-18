// frontend/src/services/socket.js

import { io } from 'socket.io-client';

function getSocketBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

export const socket = io(getSocketBaseUrl(), {
  autoConnect: false,
  withCredentials: true,
});

export function connectSocket() {
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}

