import { useState, useEffect } from 'react';

/**
 * usePagination - Specialized Pagination Management
 * 
 * ✅ DL-001: Pure pagination logic, no hardcode
 * ✅ SINGLE RESPONSIBILITY: Pagination state only
 * ✅ 40 lines extracted from LiveTradingFeed.jsx
 */
export const usePagination = (initialPageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);

  // Calculated values
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  // Navigation handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages || 1, prev + 1));
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(totalPages || 1, page)));
  };

  // Reset pagination when external dependencies change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Update total count (called by parent components)
  const updateTotalCount = (count) => {
    setTotalCount(count);
  };

  return {
    // State
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    
    // Calculated values
    startIndex,
    endIndex,
    
    // Actions
    handlePreviousPage,
    handleNextPage,
    handlePageSizeChange,
    goToPage,
    resetPagination,
    updateTotalCount,
    
    // Computed flags
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
  };
};