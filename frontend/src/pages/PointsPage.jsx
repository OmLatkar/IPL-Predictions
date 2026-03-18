// frontend/src/pages/PointsPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pointsAPI } from '../services/api';
import { useGroup } from '../context/GroupContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GroupSelector from '../components/user/GroupSelector';
import PointsTable from '../components/user/PointsTable';
import { ROUTES } from '../utils/constants';

export default function PointsPage() {
  const [myGroupsPoints, setMyGroupsPoints] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const { selectedGroup, userGroups } = useGroup();

  useEffect(() => {
    fetchMyGroupsPoints();
  }, []);

  const fetchMyGroupsPoints = async () => {
    try {
      setLoadingGroups(true);
      const response = await pointsAPI.getMyGroupsPoints();
      setMyGroupsPoints(response.data.data.groups);
    } catch (err) {
      console.error('Failed to load groups points:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  if (loadingGroups) return <LoadingSpinner fullScreen />;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Points & Rankings
        </h1>
        <p className="text-gray-600 mt-2">
          Track your performance across all groups
        </p>
      </div>

      {myGroupsPoints.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Groups Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroupsPoints.map((group) => (
              <div key={group.group.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{group.group.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      group.rank === 1 ? 'bg-amber-100 text-amber-800' :
                      group.rank === 2 ? 'bg-gray-200 text-gray-800' :
                      group.rank === 3 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      Rank #{group.rank}
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Your Points:</span>
                    <span className="font-semibold text-gray-900">{group.userPoints.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Members:</span>
                    <span className="font-semibold text-gray-900">{group.totalMembers}</span>
                  </div>
                  {group.topUsers && group.topUsers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Top Players:</p>
                      {group.topUsers.map((user, idx) => (
                        <div key={idx} className="flex justify-between text-xs py-1">
                          <span className="text-gray-600">{user.username}</span>
                          <span className="font-medium text-gray-900">{user.points.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {userGroups.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Group to View Full Table
          </label>
          <div className="max-w-xs">
            <GroupSelector />
          </div>
        </div>
      )}

      {selectedGroup && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Points Table</h2>
          <PointsTable />
        </div>
      )}

      {userGroups.length === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Joined</h3>
          <p className="text-gray-500 mb-6">
            You haven&apos;t joined any groups yet. Join groups during registration to see points and rankings.
          </p>
          <Link to={ROUTES.REGISTER} className="btn-primary inline-block">
            Create Account
          </Link>
        </div>
      )}
    </div>
  );
}
