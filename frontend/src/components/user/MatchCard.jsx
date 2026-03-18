// frontend/src/components/user/MatchCard.jsx

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { votesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import toast from 'react-hot-toast';
import { POINTS_CONFIG, TOAST_MESSAGES } from '../../utils/constants';

export default function MatchCard({ match, onVoteUpdate }) {
  const [selectedTeam, setSelectedTeam] = useState(match.userVote || '');
  const [isVoting, setIsVoting] = useState(false);
  const [showVotes, setShowVotes] = useState(false);
  const [voteCounts, setVoteCounts] = useState(null);
  const [loadingVotes, setLoadingVotes] = useState(false);
  
  const { user } = useAuth();
  const { selectedGroup } = useGroup();

  const deadline = new Date(match.votingDeadline);
  const now = new Date();
  const isVotingOpen = match.isVotingOpen && match.status === 'pending';
  const timeRemaining = formatDistanceToNow(deadline, { addSuffix: true });

  const handleVote = async (team) => {
    if (!isVotingOpen) return;
    
    try {
      setIsVoting(true);
      await votesAPI.castVote({
        matchId: match.id,
        selectedTeam: team
      });
      
      setSelectedTeam(team);
      toast.success(selectedTeam ? TOAST_MESSAGES.VOTE_UPDATED : TOAST_MESSAGES.VOTE_SUCCESS);
      
      if (onVoteUpdate) {
        onVoteUpdate();
      }
    } catch (error) {
      toast.error(error.message || TOAST_MESSAGES.VOTE_ERROR);
    } finally {
      setIsVoting(false);
    }
  };

  const handleCancelVote = async () => {
    if (!isVotingOpen || !selectedTeam) return;
    
    try {
      setIsVoting(true);
      await votesAPI.cancelVote(match.id);
      setSelectedTeam('');
      toast.success(TOAST_MESSAGES.VOTE_CANCELLED);
      
      if (onVoteUpdate) {
        onVoteUpdate();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsVoting(false);
    }
  };

  const fetchVoteCounts = async () => {
    if (showVotes) {
      setShowVotes(false);
      return;
    }
    
    try {
      setLoadingVotes(true);
      const response = await votesAPI.getMatchVotes(match.id);
      setVoteCounts(response.data.data.votes);
      setShowVotes(true);
    } catch (error) {
      toast.error('Failed to load vote counts');
    } finally {
      setLoadingVotes(false);
    }
  };

  return (
    <div className="card hover:shadow-xl transition-all duration-300">
      {/* Match Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {match.team1} vs {match.team2}
          </h3>
          <div className="mt-1 text-sm text-gray-500">
            <span className={!isVotingOpen ? 'text-red-500 font-medium' : ''}>
              {isVotingOpen ? `Voting ends ${timeRemaining}` : 'Voting closed'}
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          match.status === 'complete' 
            ? 'bg-gray-100 text-gray-600' 
            : 'bg-green-100 text-green-600'
        }`}>
          {match.status === 'complete' ? 'Completed' : 'Live'}
        </span>
      </div>

      {/* Teams and Voting */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Team 1 */}
        <button
          onClick={() => handleVote(match.team1)}
          disabled={!isVotingOpen || isVoting}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedTeam === match.team1
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-200 hover:border-amber-300'
          } ${!isVotingOpen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="text-center">
            <div className="font-semibold text-gray-900">{match.team1}</div>
            {selectedTeam === match.team1 && (
              <div className="mt-2 text-xs font-semibold text-amber-700">
                Selected
              </div>
            )}
          </div>
        </button>

        {/* Team 2 */}
        <button
          onClick={() => handleVote(match.team2)}
          disabled={!isVotingOpen || isVoting}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedTeam === match.team2
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-200 hover:border-amber-300'
          } ${!isVotingOpen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="text-center">
            <div className="font-semibold text-gray-900">{match.team2}</div>
            {selectedTeam === match.team2 && (
              <div className="mt-2 text-xs font-semibold text-amber-700">
                Selected
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Vote Status */}
      {selectedTeam && isVotingOpen && (
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            You voted for: <span className="font-semibold text-amber-600">{selectedTeam}</span>
          </p>
          <button
            onClick={handleCancelVote}
            disabled={isVoting}
            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            Cancel Vote
          </button>
        </div>
      )}

      {/* Winner Display (for completed matches) */}
      {match.status === 'complete' && match.winningTeam && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            Winner: <span className="font-bold">{match.winningTeam}</span>
          </p>
          {selectedTeam && (
            <p className="text-xs mt-1">
              {selectedTeam === match.winningTeam
                ? 'You predicted correctly.'
                : 'You predicted incorrectly.'}
            </p>
          )}
        </div>
      )}

      {/* View Votes Button (after deadline) */}
      {!isVotingOpen && match.status === 'pending' && (
        <div className="mt-4">
          <button
            onClick={fetchVoteCounts}
            disabled={loadingVotes}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            {loadingVotes ? 'Loading...' : showVotes ? 'Hide votes' : 'View group votes'}
          </button>

          {/* Vote Counts Display */}
          {showVotes && voteCounts && voteCounts[selectedGroup] && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Votes in your group:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{match.team1}</span>
                  <span className="text-sm font-semibold">
                    {voteCounts[selectedGroup]?.team1?.count || 0} votes
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{match.team2}</span>
                  <span className="text-sm font-semibold">
                    {voteCounts[selectedGroup]?.team2?.count || 0} votes
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Points Info */}
      {match.status === 'complete' && (
        <div className="mt-4 text-xs text-gray-400 border-t pt-3">
          <p>Losers lose {POINTS_CONFIG.LOSS_PENALTY} points each</p>
          <p>Winners share the pot equally</p>
        </div>
      )}
    </div>
  );
}