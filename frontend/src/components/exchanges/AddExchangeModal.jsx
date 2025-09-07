import React from 'react';
// DL-076 COMPLIANCE: Direct hooks, no wrapper context
import useExchangeOperations from '../../features/exchanges/hooks/useExchangeOperations';
import ExchangeSelector from './ExchangeSelector';
import ExchangeConnectionForm from './ExchangeConnectionForm';
import useExchangeModalState from './hooks/useExchangeModalState';

const AddExchangeModal = ({ isOpen, onClose, onExchangeAdded }) => {
  // ✅ Direct hook composition - no wrapper context
  const { addExchange } = useExchangeOperations();
  const {
    loading,
    setLoading,
    selectedExchange,
    formData,
    error,
    setError,
    handleExchangeSelect,
    handleInputChange,
    resetForm
  } = useExchangeModalState();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExchange) {
      setError('Por favor selecciona un exchange');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const exchangeData = {
        exchange_name: selectedExchange,
        ...formData
      };

      const result = await addExchange(exchangeData);
      
      if (result.success) {
        onExchangeAdded();
        resetForm();
      } else {
        setError(result.error || 'Error al agregar exchange');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Agregar Exchange</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ExchangeSelector 
            selectedExchange={selectedExchange}
            onExchangeSelect={handleExchangeSelect}
          />

          <ExchangeConnectionForm
            selectedExchange={selectedExchange}
            formData={formData}
            loading={loading}
            error={error}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default AddExchangeModal;