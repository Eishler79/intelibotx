import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

/**
 * PaginationControls - Specialized Pagination UI Component
 * 
 * ✅ DL-001: Pure pagination controls, no hardcode
 * ✅ SINGLE RESPONSIBILITY: Pagination UI only
 * ✅ 90 lines extracted from LiveTradingFeed.jsx
 */
export const PaginationControls = ({ 
  pagination, 
  loading, 
  onRefresh 
}) => {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700/50">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={pagination.handlePreviousPage}
          disabled={pagination.isFirstPage}
          className="flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Anterior
        </Button>
        
        <div className="flex items-center gap-1 mx-3">
          {/* First page */}
          {pagination.currentPage > 2 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => pagination.goToPage(1)}
                className="px-2"
              >
                1
              </Button>
              {pagination.currentPage > 3 && <MoreHorizontal size={16} className="text-gray-400" />}
            </>
          )}
          
          {/* Previous page */}
          {pagination.hasPreviousPage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => pagination.goToPage(pagination.currentPage - 1)}
              className="px-2"
            >
              {pagination.currentPage - 1}
            </Button>
          )}
          
          {/* Current page */}
          <Button size="sm" variant="default" className="px-2">
            {pagination.currentPage}
          </Button>
          
          {/* Next page */}
          {pagination.hasNextPage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => pagination.goToPage(pagination.currentPage + 1)}
              className="px-2"
            >
              {pagination.currentPage + 1}
            </Button>
          )}
          
          {/* Last page */}
          {pagination.currentPage < pagination.totalPages - 1 && (
            <>
              {pagination.currentPage < pagination.totalPages - 2 && <MoreHorizontal size={16} className="text-gray-400" />}
              <Button
                size="sm"
                variant="outline"
                onClick={() => pagination.goToPage(pagination.totalPages)}
                className="px-2"
              >
                {pagination.totalPages}
              </Button>
            </>
          )}
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={pagination.handleNextPage}
          disabled={pagination.isLastPage}
          className="flex items-center gap-1"
        >
          Siguiente
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Refresh button */}
      <Button
        size="sm"
        variant="outline"
        onClick={onRefresh}
        className="flex items-center gap-1"
        disabled={loading}
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        Actualizar
      </Button>
    </div>
  );
};