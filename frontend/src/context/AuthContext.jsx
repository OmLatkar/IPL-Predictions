// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { STORAGE_KEYS, ROUTES, TOAST_MESSAGES } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.TOKEN));
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    // Verify token on mount and refresh
    if (token) {
      loadUser();
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      const userData = response.data.data.user;
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, token: newToken } = response.data.data;
      
      setUser(user);
      setToken(newToken);
      
      localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      toast.success(TOAST_MESSAGES.LOGIN_SUCCESS);
      
      // Redirect based on role
      if (user.isAdmin) {
        navigate(ROUTES.ADMIN);
      } else {
        navigate(ROUTES.DASHBOARD);
      }
      
      return { success: true };
    } catch (error) {
      toast.error(error.message || TOAST_MESSAGES.LOGIN_ERROR);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token: newToken } = response.data.data;
      
      setUser(user);
      setToken(newToken);
      
      localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      toast.success(TOAST_MESSAGES.REGISTER_SUCCESS);
      
      // Redirect based on role
      if (user.isAdmin) {
        navigate(ROUTES.ADMIN);
      } else {
        navigate(ROUTES.DASHBOARD);
      }
      
      return { success: true };
    } catch (error) {
      toast.error(error.message || TOAST_MESSAGES.REGISTER_ERROR);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_GROUP);
    navigate(ROUTES.LOGIN);
    toast.success('Logged out successfully');
  };

  const joinGroups = async (groupIds) => {
    try {
      const response = await authAPI.joinGroups(groupIds);
      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      toast.success(TOAST_MESSAGES.GROUP_JOINED);
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      await authAPI.leaveGroup(groupId);
      // Update user state by removing the group
      setUser(prev => ({
        ...prev,
        userGroups: prev.userGroups.filter(ug => ug.groupId !== groupId)
      }));
      
      // Update stored user
      const storedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
      storedUser.userGroups = storedUser.userGroups.filter(ug => ug.groupId !== groupId);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(storedUser));
      
      toast.success(TOAST_MESSAGES.GROUP_LEFT);
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login,
    register,
    logout,
    joinGroups,
    leaveGroup,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};