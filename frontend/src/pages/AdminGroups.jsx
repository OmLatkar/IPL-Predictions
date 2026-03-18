// frontend/src/pages/AdminGroups.jsx

import React, { useState, useEffect } from 'react';
import { adminAPI, groupsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, usersRes] = await Promise.all([
        adminAPI.getAllGroups(),
        adminAPI.getAllUsers()
      ]);
      setGroups(groupsRes.data.data.groups);
      setUsers(usersRes.data.data.users);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Group name is required';
    if (formData.name.length < 3) errors.name = 'Name must be at least 3 characters';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      await adminAPI.createGroup(formData);
      toast.success('Group created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', isActive: true });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    const errors = {};
    if (!formData.name.trim()) errors.name = 'Group name is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      await adminAPI.updateGroup(selectedGroup.id, formData);
      toast.success('Group updated successfully');
      setShowEditModal(false);
      setSelectedGroup(null);
      setFormData({ name: '', description: '', isActive: true });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to update group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This will remove all members and match results.')) return;

    try {
      await adminAPI.deleteGroup(groupId);
      toast.success('Group deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const handleAddUser = async (userId) => {
    if (!selectedGroup) return;

    try {
      await adminAPI.addUserToGroup(selectedGroup.id, userId);
      toast.success('User added to group');
      setShowAddUserModal(false);
      setSelectedGroup(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to add user');
    }
  };

  const handleRemoveUser = async (groupId, userId) => {
    if (!window.confirm('Remove this user from the group?')) return;

    try {
      await adminAPI.removeUserFromGroup(groupId, userId);
      toast.success('User removed from group');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to remove user');
    }
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      isActive: group.isActive
    });
    setShowEditModal(true);
  };

  const openAddUserModal = (group) => {
    setSelectedGroup(group);
    setShowAddUserModal(true);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Groups
          </h1>
          <p className="text-gray-600 mt-2">
            Create and manage groups, add or remove members
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`p-4 ${
              group.isActive ? 'bg-primary-600' : 'bg-gray-400'
            }`}>
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  group.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                }`}>
                  {group.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {group.description && (
                <p className="text-sm text-white text-opacity-90 mt-1">{group.description}</p>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  <span className="font-bold text-gray-900">{group._count?.userGroups || 0}</span> members
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => openAddUserModal(group)}
                    className="text-sm text-primary-600 hover:text-primary-700 px-2 py-1 rounded border border-primary-200 hover:bg-primary-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => openEditModal(group)}
                    className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Members List */}
              {group.userGroups && group.userGroups.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {group.userGroups.map((ug) => (
                    <div key={ug.user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-semibold text-primary-700">
                          {ug.user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="ml-2 text-sm text-gray-700">{ug.user.username}</span>
                        {ug.user.isAdmin && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-gray-900">
                          {ug.points.toFixed(2)} pts
                        </span>
                        <button
                          onClick={() => handleRemoveUser(group.id, ug.user.id)}
                          className="text-xs text-red-500 hover:text-red-600 border border-red-200 px-1.5 py-0.5 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-4">No members yet</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Group</h2>
            
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="label">Group Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., IPL Experts 2026"
                />
                {formErrors.name && <p className="error-text">{formErrors.name}</p>}
              </div>

              <div className="mb-4">
                <label className="label">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Describe the group..."
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active (users can join)</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Group</h2>
            
            <form onSubmit={handleUpdateGroup}>
              <div className="mb-4">
                <label className="label">Group Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                />
                {formErrors.name && <p className="error-text">{formErrors.name}</p>}
              </div>

              <div className="mb-4">
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedGroup(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Updating...' : 'Update Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Add User to {selectedGroup.name}
            </h2>
            
            <div className="max-h-96 overflow-y-auto">
              {users
                .filter(user => !selectedGroup.userGroups?.some(ug => ug.user.id === user.id))
                .map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleAddUser(user.id)}
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">
                          Member of {user._count?.userGroups || 0} groups
                        </p>
                      </div>
                    </div>
                    {user.isAdmin && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddUserModal(false);
                  setSelectedGroup(null);
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}