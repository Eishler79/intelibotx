import { useState, useMemo } from "react";

/**
 * @typedef {Object} SortConfig
 * @property {string|null} key - The key to sort by
 * @property {'asc'|'desc'} direction - The sort direction
 */

/**
 * @typedef {Object} UseBotTableSortingReturn
 * @property {SortConfig} sortConfig - Current sort configuration
 * @property {any[]} sortedBots - Sorted array of bots
 * @property {(key: string) => void} handleSort - Handler for column sort clicks
 */

/**
 * useBotTableSorting Hook - Manages sorting logic for bot table
 * 
 * @param {any[]} bots - Array of bot objects to sort
 * @returns {UseBotTableSortingReturn} Sorting state and handlers
 */
const useBotTableSorting = (bots) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedBots = useMemo(() => {
    if (!Array.isArray(bots)) return [];
    
    let sortableBots = [...bots];
    if (sortConfig.key) {
      sortableBots.sort((a, b) => {
        let aValue = a?.[sortConfig.key];
        let bValue = b?.[sortConfig.key];
        
        // Handle nested object properties (e.g., metrics.sharpeRatio)
        if (sortConfig.key.includes('.')) {
          const keys = sortConfig.key.split('.');
          aValue = keys.reduce((obj, key) => obj?.[key], a);
          bValue = keys.reduce((obj, key) => obj?.[key], b);
        }
        
        // Convert to numbers if possible, fallback to 0 for NaN values
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        
        // Number comparison logic with direction support
        if (aNum < bNum) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aNum > bNum) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableBots;
  }, [bots, sortConfig]);

  return {
    sortConfig,
    sortedBots,
    handleSort
  };
};

export default useBotTableSorting;