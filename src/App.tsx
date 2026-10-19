/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SystemConfigProvider } from './contexts/SystemConfigContext';
import { AdMobProvider } from './contexts/AdMobContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './views/Login';
import Home from './views/Home';
import Dashboard from './views/Dashboard';
import Batches from './views/Batches';
import Feed from './views/Feed';
import Medicine from './views/Medicine';
import Mortality from './views/Mortality';
import Expenses from './views/Expenses';
import Sales from './views/Sales';
import Dues from './views/Dues';
import Reports from './views/Reports';
import Profile from './views/Profile';
import Guidelines from './views/Guidelines';
import PrivacyPolicy from './views/PrivacyPolicy';
import Marketplace from './views/Marketplace';
import DoctorConsultation from './views/DoctorConsultation';
import StoreDirectory from './views/StoreDirectory';
import ChickMarket from './views/ChickMarket';
import FCR from './views/FCR';
import AppLifecycleHandler from './components/AppLifecycleHandler';
import ErrorBoundary from './components/ErrorBoundary';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const isExplicitlyLoggedOut = localStorage.getItem('user_has_logged_out') === 'true';
  const hasCachedSession = (localStorage.getItem('has_authenticated_session') === 'true' || !!localStorage.getItem('cached_auth_user')) && !isExplicitlyLoggedOut;

  if (loading && !currentUser && !hasCachedSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (currentUser || hasCachedSession) ? <>{children}</> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { currentUser } = useAuth();
  const isExplicitlyLoggedOut = localStorage.getItem('user_has_logged_out') === 'true';
  const hasCachedSession = (Boolean(currentUser) || localStorage.getItem('has_authenticated_session') === 'true' || Boolean(localStorage.getItem('cached_auth_user'))) && !isExplicitlyLoggedOut;

  return (
    <Router>
      <AppLifecycleHandler />
      <AdMobProvider>
        <Routes>
          <Route path="/login" element={hasCachedSession ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="batches" element={<Batches />} />
            <Route path="feed" element={<Feed />} />
            <Route path="fcr" element={<FCR />} />
            <Route path="medicine" element={<Medicine />} />
            <Route path="mortality" element={<Mortality />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="sales" element={<Sales />} />
            <Route path="dues" element={<Dues />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="doctor" element={<DoctorConsultation />} />
            <Route path="chicks" element={<ChickMarket />} />
            <Route path="hatchery" element={<ChickMarket />} />
            <Route path="store" element={<StoreDirectory />} />
            <Route path="shop" element={<StoreDirectory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="guidelines" element={<Guidelines />} />
          </Route>
        </Routes>
      </AdMobProvider>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <SystemConfigProvider>
            <Toaster position="top-center" />
            <AppRoutes />
          </SystemConfigProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

