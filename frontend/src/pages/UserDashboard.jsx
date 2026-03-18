// frontend/src/pages/UserDashboard.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import GroupSelector from '../components/user/GroupSelector';
import PointsTable from '../components/user/PointsTable';
import MatchesList from '../components/user/MatchesList';
import { pointsAPI } from '../services/api';
import { ROUTES } from '../utils/constants';

export default function UserDashboard() {
  const { user } = useAuth();
  const { selectedGroup, hasGroups } = useGroup();
  const [groupStats, setGroupStats] = useState(null);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupStats();
    }
  }, [selectedGroup]);

  const fetchGroupStats = async () => {
    try {
      const response = await pointsAPI.getGroupPoints(selectedGroup);
      const data = response.data.data;

      const userEntry = data.pointsTable.find(entry => entry.isCurrentUser);
      const topEntry = data.pointsTable[0];

      setGroupStats({
        userRank: userEntry?.rank || 0,
        userPoints: userEntry?.points || 0,
        topPlayer: topEntry?.username || 'N/A',
        topPoints: topEntry?.points || 0,
        totalPlayers: data.pointsTable.length,
        pointsBehind: userEntry ? (topEntry?.points - userEntry?.points) : 0
      });
    } catch (error) {
      console.error('Failed to fetch group stats:', error);
    }
  };

  if (!hasGroups) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-10 text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">No groups yet</h2>
          <p className="text-gray-600">
            Join a group to start predicting and earning points.
          </p>
          <Link to={ROUTES.POINTS} className="btn-primary inline-block">
            Browse groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header + group selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.username}
          </h1>
          <p className="text-gray-600 mt-1">
            Pick a group and start voting on matches.
          </p>
        </div>
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current group
          </label>
          <GroupSelector />
        </div>
      </div>

      {/* Main layout: matches focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Matches – main focus */}
        <section className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100">
              <h2 className="text-xl font-semibold text-gray-900">
                Matches & voting
              </h2>
              <span className="text-xs text-gray-500">
                This is your main screen – vote here
              </span>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <MatchesList />
            </div>
          </div>
        </section>

        {/* Sidebar: quick group overview + links */}
        <aside className="space-y-4">
          {/* Compact stats */}
          {groupStats && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-amber-100 pb-2">
                Your position in this group
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rank</span>
                  <span className="text-lg font-semibold text-gray-900">
                    #{groupStats.userRank}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your points</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {groupStats.userPoints.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Players</span>
                  <span className="text-sm font-medium text-gray-900">
                    {groupStats.totalPlayers}
                  </span>
                </div>
              </div>
            </div>
          )}

        </aside>
      </div>

      {/* Full points table preview under main content */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">
          Group points table
        </h2>
        <PointsTable />
      </section>
    </div>
  );
}