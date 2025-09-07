/**
 * 🤖 useBotUniqueTemplates - Hook especializado para templates Bot Único
 * 
 * Características:
 * - Templates como configuraciones iniciales para Bot Único
 * - API integration para templates administrados
 * - Estado de templates + loading/error handling
 * - Alineado con CORE_PHILOSOPHY Bot Único adaptativo
 * 
 * SPEC_REF: DL-077 Bot Único Templates Architecture Pattern
 * Eduard Guzmán - InteliBotX
 */

import { useState, useEffect } from 'react';

export const useBotUniqueTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBotUniqueTemplates = async () => {
      try {
        setLoading(true);
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
        
        // 🎯 DL-001 COMPLIANCE: Real API endpoint (NO hardcode)
        const response = await fetch(`${BASE_URL}/api/bot-unique-templates`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform to Bot Único template format
        const botUniqueTemplates = data.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          icon: template.icon,
          // Bot Único initial configuration (NOT static bot config)
          initial_config: {
            initial_capital_allocation: template.capital_allocation || 0.8,
            risk_tolerance: template.risk_level || 'MEDIUM',
            preferred_modes: template.operational_modes || ['SCALPING_MODE'],
            max_concurrent_trades: template.max_trades || 3,
            institutional_algorithms_priority: template.institutional_focus || true
          },
          // Performance analytics from admin testing
          performance_metrics: template.performance_data || null,
          created_by_admin: template.admin_created || false,
          last_updated: template.updated_at
        }));

        setTemplates(botUniqueTemplates);
        setError(null);

      } catch (err) {
        console.error('Error fetching Bot Único templates:', err);
        setError(err.message);
        
        // 🚨 Fallback: Empty array (no hardcode fallback)
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBotUniqueTemplates();
  }, []);

  const refetch = () => {
    setLoading(true);
    setError(null);
  };

  return {
    templates,
    loading,
    error,
    refetch
  };
};