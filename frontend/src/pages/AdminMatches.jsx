// frontend/src/pages/AdminMatches.jsx

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { matchesAPI, pointsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { IPL_TEAMS, TOAST_MESSAGES } from '../utils/constants';
import toast from 'react-hot-toast';
import { socket } from '../services/socket';

export default function AdminMatches() {
  const [searchParams] = useSearchParams();
  const declareMatchId = searchParams.get('declare');

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeclareModal, setShowDeclareModal] = useState(!!declareMatchId);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [formData, setFormData] = useState({
    team1: '',
    team2: '',
    votingDeadline: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    const upsertMatch = (incoming) => {
      if (!incoming?.id) return;
      setMatches((prev) => {
        const idx = prev.findIndex(m => m.id === incoming.id);
        if (idx === -1) return [incoming, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...incoming };
        return next;
      });
    };

    const onNewMatch = (match) => upsertMatch(match);
    const onMatchUpdated = (match) => upsertMatch(match);
    const onMatchDeleted = (matchId) => setMatches(prev => prev.filter(m => m.id !== matchId));
    const onMatchCompleted = ({ matchId, winningTeam, match }) => {
      setMatches(prev => prev.map(m => (
        m.id === matchId
          ? { ...m, ...match, status: 'complete', winningTeam, isVotingOpen: false, timeRemaining: 0 }
          : m
      )));
    };
    const onVotingClosed = ({ matchId }) => {
      setMatches(prev => prev.map(m => (
        m.id === matchId ? { ...m, isVotingOpen: false, timeRemaining: 0 } : m
      )));
    };

    socket.on('new-match', onNewMatch);
    socket.on('match-updated', onMatchUpdated);
    socket.on('match-deleted', onMatchDeleted);
    socket.on('match-completed', onMatchCompleted);
    socket.on('voting-closed', onVotingClosed);

    return () => {
      socket.off('new-match', onNewMatch);
      socket.off('match-updated', onMatchUpdated);
      socket.off('match-deleted', onMatchDeleted);
      socket.off('match-completed', onMatchCompleted);
      socket.off('voting-closed', onVotingClosed);
    };
  }, []);

  useEffect(() => {
    if (declareMatchId && matches.length > 0) {
      const match = matches.find(m => m.id === declareMatchId);
      if (match && match.status === 'pending') {
        setSelectedMatch(match);
        setShowDeclareModal(true);
      }
    }
  }, [declareMatchId, matches]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await matchesAPI.getAll();
      setMatches(response.data.data.matches);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    
    // Validate
    const errors = {};
    if (!formData.team1) errors.team1 = 'Please select team 1';
    if (!formData.team2) errors.team2 = 'Please select team 2';
    if (formData.team1 === formData.team2) errors.team2 = 'Teams must be different';
    if (!formData.votingDeadline) errors.votingDeadline = 'Please select deadline';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      await matchesAPI.create(formData);
      toast.success(TOAST_MESSAGES.MATCH_CREATED);
      setShowCreateModal(false);
      setFormData({ team1: '', team2: '', votingDeadline: '' });
      fetchMatches();
    } catch (error) {
      toast.error(error.message || 'Failed to create match');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclareWinner = async (winningTeam) => {
    if (!selectedMatch) return;

    try {
      setSubmitting(true);
      await pointsAPI.declareWinner(selectedMatch.id, winningTeam);
      toast.success(TOAST_MESSAGES.WINNER_DECLARED);
      setShowDeclareModal(false);
      setSelectedMatch(null);
      fetchMatches();
    } catch (error) {
      toast.error(error.message || 'Failed to declare winner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      await matchesAPI.delete(matchId);
      toast.success('Match deleted successfully');
      fetchMatches();
    } catch (error) {
      toast.error(error.message || 'Failed to delete match');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Matches
          </h1>
          <p className="text-gray-600 mt-2">
            Create, update, and declare winners for matches
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Match
        </button>
      </div>

      {/* Matches List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Votes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Winner
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {match.team1} vs {match.team2}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {formatDate(match.votingDeadline)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      match.status === 'complete'
                        ? 'bg-green-100 text-green-800'
                        : new Date(match.votingDeadline) > new Date()
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {match.status === 'complete' 
                        ? 'Completed' 
                        : new Date(match.votingDeadline) > new Date()
                          ? 'Voting Open'
                          : 'Awaiting Result'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {match.totalVotes || 0} votes
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {match.winningTeam ? (
                      <span className="text-sm font-medium text-green-600">
                        {match.winningTeam}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {match.status === 'pending' && new Date(match.votingDeadline) < new Date() && (
                      <button
                        onClick={() => {
                          setSelectedMatch(match);
                          setShowDeclareModal(true);
                        }}
                        className="text-sm text-green-600 hover:text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-50"
                      >
                        Declare
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMatch(match.id)}
                      className="text-sm text-red-600 hover:text-red-700 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {matches.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Matches</h3>
            <p className="text-gray-500 mb-6">Create your first match to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Match
            </button>
          </div>
        )}
      </div>

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Match</h2>
            
            <form onSubmit={handleCreateMatch}>
              {/* Team 1 */}
              <div className="mb-4">
                <label className="label">Team 1</label>
                <select
                  value={formData.team1}
                  onChange={(e) => setFormData({ ...formData, team1: e.target.value })}
                  className={`input-field ${formErrors.team1 ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Team</option>
                  {IPL_TEAMS.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
                {formErrors.team1 && <p className="error-text">{formErrors.team1}</p>}
              </div>

              {/* Team 2 */}
              <div className="mb-4">
                <label className="label">Team 2</label>
                <select
                  value={formData.team2}
                  onChange={(e) => setFormData({ ...formData, team2: e.target.value })}
                  className={`input-field ${formErrors.team2 ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Team</option>
                  {IPL_TEAMS.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
                {formErrors.team2 && <p className="error-text">{formErrors.team2}</p>}
              </div>

              {/* Deadline */}
              <div className="mb-6">
                <label className="label">Voting Deadline</label>
                <input
                  type="datetime-local"
                  value={formData.votingDeadline}
                  onChange={(e) => setFormData({ ...formData, votingDeadline: e.target.value })}
                  className={`input-field ${formErrors.votingDeadline ? 'border-red-500' : ''}`}
                />
                {formErrors.votingDeadline && <p className="error-text">{formErrors.votingDeadline}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Enter in your local time (will be converted to UTC)
                </p>
              </div>

              {/* Actions */}
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
                  {submitting ? 'Creating...' : 'Create Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Declare Winner Modal */}
      {showDeclareModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Declare Winner</h2>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Select the winning team for {selectedMatch.team1} vs {selectedMatch.team2}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleDeclareWinner(selectedMatch.team1)}
                  disabled={submitting}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all"
                >
                  <span className="font-semibold">{selectedMatch.team1}</span>
                </button>
                <button
                  onClick={() => handleDeclareWinner(selectedMatch.team2)}
                  disabled={submitting}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-all"
                >
                  <span className="font-semibold">{selectedMatch.team2}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDeclareModal(false);
                  setSelectedMatch(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}