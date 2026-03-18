// frontend/src/pages/Register.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services/api';
import { ROUTES } from '../utils/constants';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    groupIds: []
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  
  const { register } = useAuth();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.getAll();
      setAvailableGroups(response.data.data.groups);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGroupToggle = (groupId) => {
    setFormData(prev => {
      const newGroupIds = prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId];
      
      return {
        ...prev,
        groupIds: newGroupIds
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    // Prepare registration data
    const registrationData = {
      username: formData.username,
      password: formData.password,
      groupIds: formData.groupIds
    };
    
    await register(registrationData);
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-amber-50 to-gray-100">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 mb-6">
            Or{' '}
            <Link to={ROUTES.LOGIN} className="font-medium text-amber-600 hover:text-amber-500">
              sign in to existing account
            </Link>
          </p>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className={`input-field ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Choose a username"
              />
              {errors.username && (
                <p className="error-text">{errors.username}</p>
              )}
            </div>
            
            {/* Password */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
            </div>
            
            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-field ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Groups Selection */}
            <div>
              <label className="label mb-2">
                Select Groups to Join (Optional)
              </label>
              {loadingGroups ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                </div>
              ) : availableGroups.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {availableGroups.map(group => (
                    <label
                      key={group.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.groupIds.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{group.name}</p>
                        {group.description && (
                          <p className="text-xs text-gray-500">{group.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {group._count?.userGroups || 0} members
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No groups available</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                You can join more groups later from your dashboard
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-ipl-dark bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}