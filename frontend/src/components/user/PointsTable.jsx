// frontend/src/components/user/PointsTable.jsx

import React, { useState, useEffect } from 'react';
import { pointsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { useGroup } from '../../context/GroupContext';

export default function PointsTable() {
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { selectedGroup, getSelectedGroupDetails } = useGroup();
  const currentGroup = getSelectedGroupDetails();

  useEffect(() => {
    if (selectedGroup) {
      fetchPointsTable();
    }
  }, [selectedGroup]);

  const fetchPointsTable = async () => {
    try {
      setLoading(true);
      const response = await pointsAPI.getGroupPoints(selectedGroup);
      setPointsData(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load points table');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 py-4">{error}</div>;
  if (!pointsData) return null;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {currentGroup ? currentGroup.name : 'Points table'}
          </h3>
          <span className="text-sm opacity-90">
            {pointsData.pointsTable.length} player{pointsData.pointsTable.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {pointsData.pointsTable.map((entry, idx) => (
              <tr
                key={entry.userId}
                className={`${
                  entry.isCurrentUser
                    ? 'bg-amber-50 border-l-4 border-amber-500'
                    : idx % 2 === 0
                    ? 'bg-white'
                    : 'bg-gray-50'
                } hover:bg-amber-50/50 transition-colors border-b border-gray-100 last:border-0`}
              >
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center justify-center min-w-[2rem] font-semibold ${
                    entry.rank === 1 ? 'text-amber-600' :
                    entry.rank === 2 ? 'text-gray-500' :
                    entry.rank === 3 ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    #{entry.rank}
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {entry.username}
                    {entry.isCurrentUser && (
                      <span className="text-xs text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full font-medium">
                        you
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-right">
                  <span className="font-semibold text-gray-900">
                    {entry.points.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pointsData.pointsTable.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No players in this group yet.
        </div>
      )}
    </div>
  );
}
