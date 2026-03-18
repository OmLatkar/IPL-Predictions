// frontend/src/pages/AdminTournament.jsx

import React, { useState, useEffect } from 'react';
import { tournamentAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminTournament() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.status();
      setStatus(response.data.data);
    } catch (error) {
      console.error('Failed to fetch tournament status:', error);
      toast.error('Failed to load tournament status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTournament = async () => {
    try {
      setActionLoading(true);
      await tournamentAPI.start();
      toast.success('Tournament started successfully');
      fetchStatus();
    } catch (error) {
      toast.error(error.message || 'Failed to start tournament');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTournament = async () => {
    try {
      setActionLoading(true);
      await tournamentAPI.end();
      toast.success('Tournament ended successfully');
      fetchStatus();
    } catch (error) {
      toast.error(error.message || 'Failed to end tournament');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetTournament = async () => {
    if (resetConfirmText !== 'RESET TOURNAMENT') {
      toast.error('Please type "RESET TOURNAMENT" to confirm');
      return;
    }

    try {
      setActionLoading(true);
      await tournamentAPI.reset('RESET_TOURNAMENT');
      toast.success('Tournament reset successfully');
      setShowResetConfirm(false);
      setResetConfirmText('');
      fetchStatus();
    } catch (error) {
      toast.error(error.message || 'Failed to reset tournament');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Tournament Control
        </h1>
        <p className="text-gray-600 mt-2">
          Start, end, or reset the tournament
        </p>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Tournament State</p>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                status?.tournamentState === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <span className="text-lg font-semibold capitalize text-gray-900">
                {status?.tournamentState || 'Unknown'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Active Groups</p>
            <p className="text-2xl font-bold text-gray-900">
              {status?.stats?.activeGroups || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              out of {status?.stats?.totalGroups || 0} total
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">
              {status?.stats?.totalUsers || 0}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Matches</p>
            <p className="text-2xl font-bold text-gray-900">
              {status?.stats?.totalMatches || 0}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {status?.stats?.completedMatches || 0}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {status?.stats?.pendingMatches || 0}
            </div>
            <div className="text-xs text-gray-500">Live</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {status?.stats?.pendingWinnerDeclarations || 0}
            </div>
            <div className="text-xs text-gray-500">Pending Winners</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {status?.stats?.totalVotes || 0}
            </div>
            <div className="text-xs text-gray-500">Total Votes</div>
          </div>
        </div>
      </div>

      {/* Upcoming Matches */}
      {status?.upcomingMatches && status.upcomingMatches.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Matches
          </h2>
          <div className="space-y-3">
            {status.upcomingMatches.map((match, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{match.team1} vs {match.team2}</p>
                  <p className="text-xs text-gray-500">
                    Deadline: {new Date(match.votingDeadline).toLocaleString()}
                  </p>
                </div>
                <span className="text-sm text-primary-600">Upcoming</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={handleStartTournament}
          disabled={actionLoading || status?.tournamentState === 'active'}
          className="p-6 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg font-semibold block">Start Tournament</span>
          <p className="text-sm text-green-100 mt-1">Activate all groups</p>
        </button>

        <button
          onClick={handleEndTournament}
          disabled={actionLoading || status?.tournamentState !== 'active' || status?.stats?.pendingWinnerDeclarations > 0}
          className="p-6 bg-yellow-600 text-white rounded-xl shadow-lg hover:bg-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg font-semibold block">End Tournament</span>
          <p className="text-sm text-yellow-100 mt-1">Finish and freeze groups</p>
          {status?.stats?.pendingWinnerDeclarations > 0 && (
            <p className="text-xs text-white mt-2">
              ⚠️ {status.stats.pendingWinnerDeclarations} matches pending
            </p>
          )}
        </button>

        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={actionLoading}
          className="p-6 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all disabled:opacity-50"
        >
          <span className="text-lg font-semibold block">Reset Tournament</span>
          <p className="text-sm text-red-100 mt-1">Clear all data (careful!)</p>
        </button>
      </div>

      {/* Most Active Groups */}
      {status?.mostActiveGroups && status.mostActiveGroups.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Most Active Groups
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {status.mostActiveGroups.map((group, index) => (
              <div key={group.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">{group.memberCount}</span> members
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">{group.matchesPlayed}</span> matches played
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Reset Tournament</h2>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
                <li>All matches</li>
                <li>All votes</li>
                <li>All match results</li>
                <li>Reset all user points to 0</li>
              </ul>
              <p className="text-sm font-medium text-gray-900 mb-2">
                Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">RESET TOURNAMENT</span> to confirm:
              </p>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="input-field"
                placeholder="RESET TOURNAMENT"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmText('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetTournament}
                disabled={actionLoading || resetConfirmText !== 'RESET TOURNAMENT'}
                className="btn-danger"
              >
                {actionLoading ? 'Resetting...' : 'Reset Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}