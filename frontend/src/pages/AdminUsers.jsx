// frontend/src/pages/AdminUsers.jsx

import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Manage Users
        </h1>
        <p className="text-gray-600 mt-2">
          View all registered users and their group memberships
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field max-w-md"
        />
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white">
                    {user.username}
                    {user.isAdmin && (
                      <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-white text-opacity-90">
                    Joined {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  Groups: {user._count?.userGroups || 0}
                </span>
                {user.isAdmin && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    Administrator
                  </span>
                )}
              </div>

              {/* Group Memberships */}
              {user.userGroups && user.userGroups.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member of:
                  </p>
                  {user.userGroups.map((ug) => (
                    <div key={ug.group.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{ug.group.name}</span>
                      <span className="text-xs font-semibold text-primary-600">
                        {ug.points?.toFixed(2)} pts
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No groups joined</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try a different search term' : 'No users registered yet'}
          </p>
        </div>
      )}
    </div>
  );
}