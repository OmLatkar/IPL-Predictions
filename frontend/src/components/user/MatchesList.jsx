// frontend/src/components/user/MatchesList.jsx

import React, { useState, useEffect } from 'react';
import { matchesAPI } from '../../services/api';
import MatchCard from './MatchCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { useGroup } from '../../context/GroupContext';
import { socket } from '../../services/socket';

export default function MatchesList() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  
  const { selectedGroup } = useGroup();

  useEffect(() => {
    fetchMatches();
  }, [selectedGroup]);

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
    const onMatchDeleted = (matchId) => {
      setMatches(prev => prev.filter(m => m.id !== matchId));
    };
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
    return true;
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 py-4">{error}</div>;

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-amber-500 text-ipl-dark'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Matches
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

      {/* Matches Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMatches.map(match => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onVoteUpdate={fetchMatches}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No matches found</p>
        </div>
      )}
    </div>
  );
}