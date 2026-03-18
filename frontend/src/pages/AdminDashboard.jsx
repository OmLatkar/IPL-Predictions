// frontend/src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI, matchesAPI, groupsAPI, adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ROUTES } from '../utils/constants';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [pendingDeclarations, setPendingDeclarations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tournamentStatus, setTournamentStatus] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        tournamentStatusRes,
        matchesRes,
        groupsRes,
        pendingMatchesRes,
        adminGroupsRes
      ] = await Promise.all([
        tournamentAPI.status().catch(() => null),
        matchesAPI.getAll(),
        groupsAPI.getAll(),
        matchesAPI.getPendingForAdmin().catch(() => ({ data: { data: { matches: [] } } })),
        adminAPI.getAllGroups().catch(() => ({ data: { data: { groups: [] } } }))
      ]);

      setTournamentStatus(tournamentStatusRes?.data?.data || null);

      const allMatches = matchesRes.data.data.matches || [];
      setRecentMatches(allMatches.slice(0, 5));

      setPendingDeclarations(pendingMatchesRes.data.data.matches || []);

      setGroups(groupsRes.data.data.groups || []);

      const adminGroups = adminGroupsRes.data.data.groups || [];
      const totalUsers = adminGroups.reduce(
        (acc, group) => acc + (group._count?.userGroups || 0),
        0
      );

      setStats({
        totalGroups: adminGroups.length,
        totalUsers,
        totalMatches: allMatches.length,
        pendingMatches: allMatches.filter(m => m.status === 'pending').length,
        completedMatches: allMatches.filter(m => m.status === 'complete').length,
        pendingDeclarations: pendingMatchesRes.data.data.matches?.length || 0,
        totalVotes: allMatches.reduce((acc, m) => acc + (m.totalVotes || 0), 0)
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Admin control
        </h1>
        <p className="text-gray-600 mt-1">
          Your main job here: create matches and keep the tournament moving. Everything
          else lives in the menu.
        </p>
      </div>

      {/* Tournament Status Banner */}
      {tournamentStatus && (
        <div
          className={`p-4 rounded-lg ${
            tournamentStatus.tournamentState === 'active'
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  tournamentStatus.tournamentState === 'active'
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-yellow-500'
                }`}
              />
              <span className="text-sm font-medium text-gray-800">
                Tournament status:{' '}
                <span className="capitalize">
                  {tournamentStatus.tournamentState}
                </span>
              </span>
            </div>
            {tournamentStatus.stats?.pendingWinnerDeclarations > 0 && (
              <span className="text-xs md:text-sm text-red-600 font-medium">
                {tournamentStatus.stats.pendingWinnerDeclarations} match
                {tournamentStatus.stats.pendingWinnerDeclarations === 1 ? '' : 'es'} pending
                winner declaration
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main actions: vote & create match */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to={ROUTES.MATCHES}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-md p-6 text-ipl-dark hover:from-amber-600 hover:to-orange-600 transition-all border border-amber-200"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Vote on matches</h2>
          </div>
          <p className="text-sm text-amber-900/80 mb-4">
            Jump straight into the same voting screen that regular users see.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span>
              Go to matches
            </span>
          </div>
        </Link>

        <Link
          to={ROUTES.ADMIN_MATCHES}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-md p-6 text-white hover:from-green-600 hover:to-emerald-700 transition-all border border-green-200"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Create / manage matches</h2>
          </div>
          <p className="text-sm text-emerald-100 mb-4">
            Set up new fixtures, close voting, and declare winners from one place.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span>
              Open match manager
            </span>
          </div>
        </Link>
      </div>

      {/* Tournament stats */}
      {stats && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">
            Tournament overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-gray-600">Groups</p>
              <p className="text-2xl font-bold text-amber-700">{stats.totalGroups}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-gray-600">Users</p>
              <p className="text-2xl font-bold text-blue-700">{stats.totalUsers}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-gray-600">Matches</p>
              <p className="text-2xl font-bold text-green-700">{stats.totalMatches}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-gray-600">Total votes</p>
              <p className="text-2xl font-bold text-purple-700">{stats.totalVotes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Deeper match + group activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Winner Declarations */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-100">
            <h3 className="text-sm font-semibold text-red-700">
              Pending winner declarations
              {pendingDeclarations.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-700">
                  {pendingDeclarations.length}
                </span>
              )}
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {pendingDeclarations.length > 0 ? (
              <>
                {pendingDeclarations.map(match => (
                  <div key={match.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {match.team1} vs {match.team2}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Deadline passed • {match.totalVotes} votes
                        </p>
                      </div>
                      <Link
                        to={`${ROUTES.ADMIN_MATCHES}?declare=${match.id}`}
                        className="text-xs bg-amber-500 text-ipl-dark px-3 py-1 rounded-md hover:bg-amber-400 font-medium"
                      >
                        Declare winner
                      </Link>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                No matches waiting for a winner.
              </p>
            )}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
            <h3 className="text-sm font-semibold text-amber-800">
              Recent matches
            </h3>
          </div>
          <div className="p-5">
            {recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.map(match => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {match.team1} vs {match.team2}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(match.votingDeadline).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] ${
                        match.status === 'complete'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                No matches created yet.
              </p>
            )}
          </div>
        </div>

        {/* Groups Overview */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
            <h3 className="text-sm font-semibold text-purple-800">
              Groups overview
            </h3>
          </div>
          <div className="p-5">
            {groups.length > 0 ? (
              <div className="space-y-3">
                {groups.slice(0, 5).map(group => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {group.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {group._count?.userGroups || 0} members
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] ${
                        group.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                No groups created yet.
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">
              Match status
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingMatches}
                </p>
                <p className="text-xs text-gray-600">Live matches</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.completedMatches}
                </p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded col-span-2">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingDeclarations}
                </p>
                <p className="text-xs text-gray-600">Pending winners</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}