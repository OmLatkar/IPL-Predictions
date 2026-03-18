// frontend/src/pages/HistoryPage.jsx

import React, { useState, useEffect } from 'react';
import { matchesAPI, pointsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GroupSelector from '../components/user/GroupSelector';

export default function HistoryPage() {
  const [completedMatches, setCompletedMatches] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('matches'); // 'matches' or 'results'
  
  const { user } = useAuth();
  const { selectedGroup, userGroups } = useGroup();

  useEffect(() => {
    fetchCompletedMatches();
  }, []);

  useEffect(() => {
    if (selectedGroup && selectedView === 'results') {
      fetchMatchResults();
    }
  }, [selectedGroup, selectedView]);

  const fetchCompletedMatches = async () => {
    try {
      setLoading(true);
      const response = await matchesAPI.getCompleted();
      setCompletedMatches(response.data.data.matches);
      setError(null);
    } catch (err) {
      setError('Failed to load match history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchResults = async () => {
    try {
      setLoadingResults(true);
      const response = await pointsAPI.getMatchResults(selectedGroup);
      setMatchResults(response.data.data.matchResults);
    } catch (err) {
      console.error('Failed to load match results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Match History
        </h1>
        <p className="text-gray-600 mt-2">
          View past matches, your predictions, and results
        </p>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedView('matches')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'matches'
                ? 'bg-amber-500 text-ipl-dark'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Completed Matches
          </button>
          {userGroups.length > 0 && (
            <button
              onClick={() => setSelectedView('results')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedView === 'results'
                  ? 'bg-amber-500 text-ipl-dark'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Group-wise Results
            </button>
          )}
        </div>
      </div>

      {/* Group Selector (for results view) */}
      {selectedView === 'results' && userGroups.length > 0 && (
        <div className="mb-8 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Group
          </label>
          <GroupSelector />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Content */}
      {selectedView === 'matches' ? (
        /* All Completed Matches View */
        <div className="space-y-4">
          {completedMatches.length > 0 ? (
            completedMatches.map((match) => (
              <div key={match.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(match.completedAt)}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Completed
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${
                      match.winningTeam === match.team1 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-gray-50'
                    }`}>
                      <p className="font-semibold text-gray-900">{match.team1}</p>
                      {match.winningTeam === match.team1 && (
                        <span className="text-xs text-green-600 mt-1">
                          Winner
                        </span>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      match.winningTeam === match.team2 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-gray-50'
                    }`}>
                      <p className="font-semibold text-gray-900">{match.team2}</p>
                      {match.winningTeam === match.team2 && (
                        <span className="text-xs text-green-600 mt-1">
                          Winner
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Your prediction:</span>
                      {match.userVote ? (
                        <span
                          className={`text-sm font-medium ${
                            match.userVote === match.winningTeam
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {match.userVote}
                          {match.userVote === match.winningTeam ? ' (correct)' : ' (wrong)'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Did not vote</span>
                      )}
                    </div>
                    {match.results && match.results.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {match.results.length} group result(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Match History</h3>
              <p className="text-gray-500">
                No completed matches yet. Check back after matches are finished.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Group-wise Results View */
        selectedGroup && (
          <div className="space-y-6">
            {loadingResults ? (
              <LoadingSpinner />
            ) : matchResults.length > 0 ? (
              matchResults.map((result) => (
                <div key={result.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    {/* Match Info */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        {result.match.team1} vs {result.match.team2}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {formatDate(result.calculatedAt)}
                      </span>
                    </div>

                    {/* Winner */}
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        Winner: <span className="font-bold">{result.match.winningTeam}</span>
                      </p>
                    </div>

                    {/* Points Distribution */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Winners gained</p>
                        <p className="text-lg font-bold text-green-600">
                          +{result.winnerPoints.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Losers lost</p>
                        <p className="text-lg font-bold text-red-600">
                          -{result.loserPoints}
                        </p>
                      </div>
                    </div>

                    {/* User's Prediction */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Your prediction:</span>
                        {result.userVote ? (
                          <span className={`text-sm font-medium ${
                            result.userVote === result.match.winningTeam
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {result.userVote}
                            {result.userVote === result.match.winningTeam ? ' ✓' : ' ✗'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Did not vote</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-500">
                  No completed matches in this group.
                </p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}