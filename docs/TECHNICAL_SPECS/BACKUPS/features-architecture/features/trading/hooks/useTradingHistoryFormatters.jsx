/**
 * useTradingHistoryFormatters.js - Pure Formatting Functions for Trading History
 * EXTRACTED FROM: TradingHistory.jsx (lines 72-123)
 * 
 * ✅ DL-001: Pure functions - no external dependencies
 * ✅ SUCCESS CRITERIA: ≤150 lines (70 lines)
 * ✅ SINGLE RESPONSIBILITY: Formatting functions only
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import React from 'react';

/**
 * Get status badge color based on trade/order status
 * @param {string} status - Order or trade status
 * @returns {string} CSS classes for badge styling
 */
export const getStatusBadgeColor = (status) => {
  const colors = {
    'FILLED': 'bg-green-100 text-green-800',
    'PENDING': 'bg-yellow-100 text-yellow-800', 
    'CANCELLED': 'bg-red-100 text-red-800',
    'COMPLETED': 'bg-blue-100 text-blue-800',
    'OPEN': 'bg-orange-100 text-orange-800',
    'STOP_LOSS_HIT': 'bg-red-100 text-red-800',
    'TAKE_PROFIT_HIT': 'bg-green-100 text-green-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get side badge color (BUY/SELL)
 * @param {string} side - Trade side (BUY/SELL)
 * @returns {string} CSS classes for badge styling
 */
export const getSideBadgeColor = (side) => {
  return side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

/**
 * Format price with currency symbol and proper decimals
 * @param {number|string} price - Price value
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  return price ? 
    `$${parseFloat(price).toLocaleString(undefined, {
      minimumFractionDigits: 2, 
      maximumFractionDigits: 8
    })}` : 'N/A';
};

/**
 * Format date and time for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date/time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

/**
 * Format PnL value with color and sign
 * @param {number|string} pnl - PnL value
 * @returns {JSX.Element} Formatted PnL with color styling
 */
export const formatPnL = (pnl) => {
  if (!pnl && pnl !== 0) return 'N/A';
  const value = Number(pnl);
  if (isNaN(value)) return 'N/A';
  const color = value >= 0 ? 'text-green-600' : 'text-red-600';
  const sign = value >= 0 ? '+' : '';
  return (
    <span className={color}>
      {sign}${Number(value).toFixed(4)}
    </span>
  );
};

/**
 * Format PnL percentage with color and sign
 * @param {number|string} pnl - PnL percentage value
 * @returns {JSX.Element} Formatted PnL percentage with color styling
 */
export const formatPnLPercentage = (pnl) => {
  if (!pnl && pnl !== 0) return 'N/A';
  const value = Number(pnl);
  if (isNaN(value)) return 'N/A';
  const color = value >= 0 ? 'text-green-600' : 'text-red-600';
  const sign = value >= 0 ? '+' : '';
  return (
    <span className={color}>
      {sign}{Number(value).toFixed(2)}%
    </span>
  );
};