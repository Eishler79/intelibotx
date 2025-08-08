// src/routes/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth Context
import { AuthProvider } from "../contexts/AuthContext";

// Auth Components
import AuthPage from "../pages/AuthPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// Existing Pages
import Dashboard from "../pages/Dashboard";
import SmartTrade from "../pages/SmartTrade";
import SmartIntelligence from "../pages/SmartIntelligence";
import Portfolio from "../pages/Portfolio";
import BotsAdvanced from "../pages/BotsAdvanced";
import BotsEnhanced from "../pages/BotsEnhanced";
import ExchangeManagement from "../pages/ExchangeManagement";
import Layout from "../components/Layout";
import BacktestViewer from "../pages/BacktestViewer";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes - Enhanced Auth */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />
          
          {/* Redirect root to auth */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          
          {/* Protected Routes - App */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/smart-trade" element={<SmartTrade />} />
            <Route path="/intelligence" element={<SmartIntelligence />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/bots" element={<BotsAdvanced />} />
            <Route path="/bots-advanced" element={<BotsAdvanced />} />
            <Route path="/bots-enhanced" element={<BotsEnhanced />} />
            <Route path="/exchanges" element={<ExchangeManagement />} />
            <Route path="/backtest-viewer" element={<BacktestViewer symbol="BTCUSDT" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;