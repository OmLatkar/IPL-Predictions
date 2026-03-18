// frontend/src/components/common/SocketBridge.jsx

import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { connectSocket, disconnectSocket, socket } from '../../services/socket';

export default function SocketBridge() {
  const { user, isAuthenticated } = useAuth();
  const { selectedGroup } = useGroup();
  const prevGroupRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      prevGroupRef.current = null;
      disconnectSocket();
      return;
    }

    connectSocket();
    socket.emit('authenticate', user.id);
    socket.emit('join-tournament');

    return () => {
      prevGroupRef.current = null;
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const prevGroup = prevGroupRef.current;
    if (prevGroup && prevGroup !== selectedGroup) {
      socket.emit('leave-group', prevGroup);
    }
    if (selectedGroup) {
      socket.emit('join-group', selectedGroup);
      prevGroupRef.current = selectedGroup;
    }
  }, [isAuthenticated, selectedGroup]);

  return null;
}

