// src/routes/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import SmartTrade from "../pages/SmartTrade";
import SmartIntelligence from "../pages/SmartIntelligence";
import Portfolio from "../pages/Portfolio";
import Bots from "../pages/Bots";
import Layout from "../components/Layout";
import BacktestViewer from "../pages/BacktestViewer"; // 👈 Nuevo import

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/smart-trade" element={<SmartTrade />} />
          <Route path="/intelligence" element={<SmartIntelligence />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/bots" element={<Bots />} />
          <Route path="/backtest-viewer" element={<BacktestViewer symbol="BTCUSDT" />} /> {/* 👈 Nueva ruta */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;