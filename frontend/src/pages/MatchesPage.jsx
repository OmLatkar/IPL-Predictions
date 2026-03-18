// frontend/src/pages/MatchesPage.jsx

import React, { useState, useEffect } from 'react';
import { matchesAPI } from '../services/api';
import { useGroup } from '../context/GroupContext';
import MatchCard from '../components/user/MatchCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GroupSelector from '../components/user/GroupSelector';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const { selectedGroup } = useGroup();

  useEffect(() => {
    fetchMatches();
  }, [selectedGroup]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await matchesAPI.getAll();
      setMatches(response.data.data.matches);
      setError(null);
    } catch (err) {
      setError('Failed to load matches');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'pending') return match.status === 'pending';
    if (filter === 'completed') return match.status === 'complete';
    if (filter === 'voting-open') return match.isVotingOpen;
    return true;
  });

  const getStats = () => {
    const total = matches.length;
    const pending = matches.filter(m => m.status === 'pending').length;
    const completed = matches.filter(m => m.status === 'complete').length;
    const votingOpen = matches.filter(m => m.isVotingOpen).length;
    return { total, pending, completed, votingOpen };
  };

  const stats = getStats();

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Matches
        </h1>
        <p className="text-gray-600 mt-2">
          Vote on matches and track your predictions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Matches</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md border border-green-100 p-4">
          <p className="text-sm text-gray-600">Live</p>
          <p className="text-2xl font-bold text-green-700">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-md border border-blue-100 p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-blue-700">{stats.completed}</p>
        </div>
        <div className="bg-amber-50 rounded-xl shadow-md border border-amber-100 p-4">
          <p className="text-sm text-gray-600">Voting Open</p>
          <p className="text-2xl font-bold text-amber-700">{stats.votingOpen}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Group Selector */}
          <div className="w-full md:w-64">
            <GroupSelector />
          </div>

          {/* Filter Toggle for Mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
          >
            {showFilters ? 'Hide filters' : 'Show filters'}
          </button>

          {/* Filter Tabs - Desktop */}
          <div className="hidden md:flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-amber-500 text-ipl-dark'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-500 text-ipl-dark'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setFilter('voting-open')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'voting-open'
                  ? 'bg-amber-500 text-ipl-dark'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Voting Open
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-amber-500 text-ipl-dark'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2 md:hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filter === 'all'
                  ? 'bg-amber-500 text-ipl-dark'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filter === 'pending'
                  ? 'bg-amber-500 text-ipl-dark'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setFilter('voting-open')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filter === 'voting-open'
                  ? 'bg-amber-500 text-ipl-dark'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Voting Open
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-lg text-sm ${
                filter === 'completed'
                  ? 'bg-amber-500 text-ipl-dark'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Completed
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Matches Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMatches.map(match => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onVoteUpdate={fetchMatches}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Matches Found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No matches have been created yet.' 
              : `No ${filter} matches available.`}
          </p>
        </div>
      )}
    </div>
  );
}