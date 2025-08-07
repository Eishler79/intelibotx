// src/routes/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth Context
import { AuthProvider } from "../contexts/AuthContext";

// Auth Components
import LoginPage from "../components/auth/LoginPage";
import RegisterPage from "../components/auth/RegisterPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// Existing Pages
import Dashboard from "../pages/Dashboard";
import SmartTrade from "../pages/SmartTrade";
import SmartIntelligence from "../pages/SmartIntelligence";
import Portfolio from "../pages/Portfolio";
import BotsAdvanced from "../pages/BotsAdvanced";
import Layout from "../components/Layout";
import BacktestViewer from "../pages/BacktestViewer";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes - Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Protected Routes - App */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/smart-trade" element={<SmartTrade />} />
            <Route path="/intelligence" element={<SmartIntelligence />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/bots" element={<BotsAdvanced />} />
            <Route path="/bots-advanced" element={<BotsAdvanced />} />
            <Route path="/backtest-viewer" element={<BacktestViewer symbol="BTCUSDT" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;