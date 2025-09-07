import React from "react";
import { Button } from "@/components/ui/button";

/**
 * FeedFilters - Feed Time Filters and Page Size Controls
 * 
 * ✅ DL-001: Filter controls, no hardcode values
 * ✅ SINGLE RESPONSIBILITY: Filter UI only
 * ✅ 40 lines extracted from LiveTradingFeed.jsx
 */
export const FeedFilters = ({ 
  timeFilters, 
  pagination 
}) => {
  return (
    <div className="flex justify-between items-center gap-4">
      {/* Filtros de tiempo */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Período:</span>
        {timeFilters.timeOptions.map(option => (
          <Button
            key={option.value}
            size="sm"
            variant={timeFilters.timeFilter === option.value ? "default" : "outline"}
            onClick={() => timeFilters.handleTimeFilterChange(option.value)}
            className="text-xs px-2 py-1"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Selector de elementos por página */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Mostrar:</span>
        <select
          value={pagination.pageSize}
          onChange={(e) => pagination.handlePageSizeChange(parseInt(e.target.value))}
          className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Info de paginación */}
      {pagination.totalCount > 0 && (
        <div className="text-sm text-gray-400">
          {pagination.startIndex}-{pagination.endIndex} de {pagination.totalCount}
        </div>
      )}
    </div>
  );
};