// frontend/src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROUTES } from './utils/constants';
import { GroupProvider } from './context/GroupContext';

// Layout Components
import Navbar from './components/common/Navbar';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// User Pages
import UserDashboard from './pages/UserDashboard';
import MatchesPage from './pages/MatchesPage';
import PointsPage from './pages/PointsPage';
import HistoryPage from './pages/HistoryPage';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminMatches from './pages/AdminMatches';
import AdminGroups from './pages/AdminGroups';
import AdminUsers from './pages/AdminUsers';
import AdminTournament from './pages/AdminTournament';

// Home Page
import HomePage from './pages/HomePage';

// Protected Route wrapper
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={ROUTES.DASHBOARD} />;
  }

  return children;
};

// Public Route wrapper (redirects if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
    </div>;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} />;
  }

  return children;
};

function AppContent() {
  return (
    <div className="min-h-screen w-full bg-gray-100">
      <Navbar />
      <main className="w-full min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.LOGIN} element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path={ROUTES.REGISTER} element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          {/* User Routes */}
          <Route path={ROUTES.DASHBOARD} element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.MATCHES} element={
            <ProtectedRoute>
              <MatchesPage />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.POINTS} element={
            <ProtectedRoute>
              <PointsPage />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.HISTORY} element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path={ROUTES.ADMIN} element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_MATCHES} element={
            <ProtectedRoute requireAdmin>
              <AdminMatches />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_GROUPS} element={
            <ProtectedRoute requireAdmin>
              <AdminGroups />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_USERS} element={
            <ProtectedRoute requireAdmin>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_TOURNAMENT} element={
            <ProtectedRoute requireAdmin>
              <AdminTournament />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-6xl font-bold text-amber-500">404</h1>
              <p className="text-xl text-gray-600 mt-4">Page not found</p>
              <a href={ROUTES.HOME} className="btn-primary mt-8 inline-block">
                Go Home
              </a>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <GroupProvider>  
        <AppContent />
      </GroupProvider> 
    </AuthProvider>
  );
}

export default App;