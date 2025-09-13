// ✅ DL-040 Phase 6: Navigation Tabs Component
// EXTRACTED FROM: pages/BotsAdvanced.jsx (Tab navigation section)
// RISK LEVEL: 5% - Simple navigation component extraction

import React from 'react';
import { Button } from "@/components/ui/button";

/**
 * Navigation Tabs Component
 * 
 * Reusable tab navigation component with consistent styling and behavior.
 * Extracted from BotsAdvanced.jsx to provide a centralized navigation pattern
 * that can be reused across different pages and sections.
 * 
 * Features:
 * - Active state management
 * - Disabled state support
 * - Consistent InteliBotX styling
 * - Flexible tab configuration
 * - Accessibility support
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.tabs - Array of tab objects
 * @param {string} props.activeTab - Currently active tab key
 * @param {Function} props.onTabChange - Tab change handler
 * @param {string} props.className - Additional CSS classes
 */
export default function NavigationTabs({ 
  tabs = [], 
  activeTab, 
  onTabChange,
  className = "" 
}) {
  return (
    <div className={`flex space-x-4 mb-8 ${className}`}>
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          variant={activeTab === tab.key ? 'default' : 'outline'}
          onClick={() => onTabChange(tab.key)}
          disabled={tab.disabled}
          className={
            activeTab === tab.key 
              ? 'bg-intelibot-accent-gold text-intelibot-text-on-gold' 
              : 'text-intelibot-text-secondary border-intelibot-border-secondary hover:text-intelibot-accent-gold disabled:opacity-50 disabled:cursor-not-allowed'
          }
          aria-label={tab.ariaLabel || `Navegar a ${tab.label}`}
          title={tab.tooltip || tab.label}
        >
          {tab.icon && (
            <span className="mr-2">
              {tab.icon}
            </span>
          )}
          {tab.label}
          {tab.badge && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-intelibot-accent-gold/20 text-intelibot-accent-gold rounded-full">
              {tab.badge}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}

/**
 * Default tab configurations for common use cases
 */
export const defaultTabs = {
  botDashboard: [
    {
      key: 'dashboard',
      label: 'Dashboard IA',
      icon: '📊',
      tooltip: 'Vista general de métricas y rendimiento'
    },
    {
      key: 'history',
      label: 'Historial de Trading',
      icon: '📈',
      tooltip: 'Historial detallado de operaciones'
    }
  ],
  
  botManagement: [
    {
      key: 'active',
      label: 'Bots Activos',
      icon: '🤖',
      tooltip: 'Bots currently running'
    },
    {
      key: 'paused',
      label: 'Pausados',
      icon: '⏸️',
      tooltip: 'Paused bots'
    },
    {
      key: 'stopped',
      label: 'Detenidos',
      icon: '⏹️',
      tooltip: 'Stopped bots'
    }
  ],
  
  analytics: [
    {
      key: 'performance',
      label: 'Rendimiento',
      icon: '📈',
      tooltip: 'Performance metrics and analysis'
    },
    {
      key: 'risk',
      label: 'Gestión de Riesgo',
      icon: '🛡️',
      tooltip: 'Risk management and drawdown analysis'
    },
    {
      key: 'portfolio',
      label: 'Portfolio',
      icon: '💼',
      tooltip: 'Portfolio overview and allocation'
    }
  ]
};