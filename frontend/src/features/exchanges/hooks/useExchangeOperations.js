import { useCallback } from 'react';

const useExchangeOperations = (authState, authenticatedFetch) => {
  const { setUserExchanges } = authState;

  const loadUserExchanges = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/user/exchanges');
      if (response.ok) {
        const exchanges = await response.json();
        setUserExchanges(exchanges);
        return exchanges;
      }
      return [];
    } catch (error) {
      console.error('Load exchanges error:', error);
      return [];
    }
  }, [authenticatedFetch, setUserExchanges]);

  const addExchange = async (exchangeData) => {
    try {
      const response = await authenticatedFetch('/api/user/exchanges', {
        method: 'POST',
        body: JSON.stringify(exchangeData),
      });

      if (response.ok) {
        await loadUserExchanges();
        return { success: true, data: await response.json() };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add exchange');
      }
    } catch (error) {
      console.error('Add exchange error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateExchange = async (exchangeId, exchangeData) => {
    try {
      const response = await authenticatedFetch(`/api/user/exchanges/${exchangeId}`, {
        method: 'PUT',
        body: JSON.stringify(exchangeData),
      });

      if (response.ok) {
        await loadUserExchanges();
        return { success: true, data: await response.json() };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update exchange');
      }
    } catch (error) {
      console.error('Update exchange error:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteExchange = async (exchangeId) => {
    try {
      const response = await authenticatedFetch(`/api/user/exchanges/${exchangeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadUserExchanges();
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete exchange');
      }
    } catch (error) {
      console.error('Delete exchange error:', error);
      return { success: false, error: error.message };
    }
  };

  const testExchangeConnection = async (exchangeId) => {
    try {
      const response = await authenticatedFetch(`/api/user/exchanges/${exchangeId}/test`);
      
      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to test exchange connection');
      }
    } catch (error) {
      console.error('Test exchange connection error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    loadUserExchanges,
    addExchange,
    updateExchange,
    deleteExchange,
    testExchangeConnection,
  };
};

export default useExchangeOperations;