// frontend/src/context/GroupContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { useAuth } from './AuthContext';

const GroupContext = createContext();

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};

export const GroupProvider = ({ children }) => {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userGroups, setUserGroups] = useState([]);

  // Load user's groups when user changes
  useEffect(() => {
    if (user?.userGroups) {
      const groups = user.userGroups.map(ug => ({
        id: ug.group.id,
        name: ug.group.name,
        points: ug.points,
        isActive: ug.group.isActive
      }));
      setUserGroups(groups);

      // Set default selected group
      const savedGroupId = localStorage.getItem(STORAGE_KEYS.SELECTED_GROUP);
      if (savedGroupId && groups.some(g => g.id === savedGroupId)) {
        setSelectedGroup(savedGroupId);
      } else if (groups.length > 0) {
        setSelectedGroup(groups[0].id);
        localStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, groups[0].id);
      }
    } else {
      setUserGroups([]);
      setSelectedGroup(null);
    }
  }, [user]);

  const switchGroup = (groupId) => {
    if (userGroups.some(g => g.id === groupId)) {
      setSelectedGroup(groupId);
      localStorage.setItem(STORAGE_KEYS.SELECTED_GROUP, groupId);
    }
  };

  const getSelectedGroupDetails = () => {
    return userGroups.find(g => g.id === selectedGroup) || null;
  };

  const value = {
    selectedGroup,
    userGroups,
    switchGroup,
    getSelectedGroupDetails,
    hasGroups: userGroups.length > 0
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};