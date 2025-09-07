import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../features/auth/contexts/AuthContext";

// Auth Components
import AuthPage from "../pages/AuthPage";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// Pages
import DashboardPage from "../pages/DashboardPage";
import SmartTrade from "../pages/SmartTrade";
import SmartIntelligence from "../pages/SmartIntelligence";
import Portfolio from "../pages/Portfolio";
import BotsAdvanced from "../pages/BotsAdvanced";
import ExchangeManagement from "../pages/ExchangeManagement";
import Layout from "../components/Layout";
import BacktestViewer from "../pages/BacktestViewer";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Redirect root to auth */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/smart-trade" element={<SmartTrade />} />
            <Route path="/intelligence" element={<SmartIntelligence />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/bots" element={<BotsAdvanced />} />
            <Route path="/bots-advanced" element={<BotsAdvanced />} />
            <Route path="/exchanges" element={<ExchangeManagement />} />
            <Route path="/backtest-viewer" element={<BacktestViewer symbol="BTCUSDT" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;