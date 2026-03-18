// frontend/src/pages/HomePage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-amber-50 via-orange-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-4">
              IPL Prediction System
              <span className="block text-amber-600 mt-2">2026 Edition</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Predict match winners, compete with friends, and climb the leaderboard!
            </p>
            
            {!isAuthenticated ? (
              <div className="space-x-4">
                <Link
                  to={ROUTES.REGISTER}
                  className="btn-primary inline-block text-lg px-8 py-3"
                >
                  Get Started
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="btn-secondary inline-block text-lg px-8 py-3"
                >
                  Login
                </Link>
              </div>
            ) : (
              <Link
                to={ROUTES.DASHBOARD}
                className="btn-primary inline-block text-lg px-8 py-3"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card text-center border border-amber-100">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-amber-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Join Groups</h3>
            <p className="text-gray-600">
              Join existing groups or create your own with friends and family
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card text-center border border-orange-100">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-orange-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Predict Winners</h3>
            <p className="text-gray-600">
              Vote for your predicted winner before the match deadline
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card text-center border border-green-100">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Earn Points</h3>
            <p className="text-gray-600">
              Correct predictions earn points from those who voted wrong
            </p>
          </div>
        </div>
      </div>

      {/* Points System Section */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Points System</h2>
            <p className="text-lg text-gray-600 mt-2">
              Every vote matters! Here's how points are calculated
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-red-600 mb-4">Losers</h3>
              <p className="text-gray-600 mb-4">
                Each incorrect prediction costs:
              </p>
              <p className="text-4xl font-bold text-red-600">-10 points</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-green-600 mb-4">Winners</h3>
              <p className="text-gray-600 mb-4">
                Winners split the losers' points:
              </p>
              <p className="text-4xl font-bold text-green-600">
                (losers × 10) ÷ winners
              </p>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Example:</h3>
            <p className="text-gray-600">
              In a group of 10 users, if 6 vote for the winning team and 4 vote for the losing team:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
              <li>4 losers lose 10 points each = 40 points total</li>
              <li>40 points divided among 6 winners = 6.67 points each</li>
              <li>Net zero sum within the group</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Start Predicting?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Join thousands of cricket fans in the ultimate IPL prediction challenge
        </p>
        {!isAuthenticated && (
          <Link
            to={ROUTES.REGISTER}
            className="btn-primary inline-block text-lg px-8 py-3"
          >
            Create Free Account
          </Link>
        )}
      </div>
    </div>
  );
}