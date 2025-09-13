import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import BotCreationModalHeader from './BotCreationModalHeader';
import BotCreationStepManager from './BotCreationStepManager';
import MarketDataPreview from './MarketDataPreview';
import useBotCreationState from './BotCreationStateManager';

const BotCreationModal = ({ isOpen, onClose, onBotCreated, selectedTemplate }) => {
  const state = useBotCreationState(isOpen);

  // Event handlers
  const handleClose = () => {
    if (!state.loading) {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseFloat(value) || 0 : value;
    state.setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleExchangeSelect = (exchange) => {
    state.setSelectedExchange(exchange);
    state.setFormData(prev => ({ ...prev, exchange_id: exchange.id }));
  };

  const handleNextStep = () => {
    if (state.currentStep < state.steps.length - 1) {
      state.setCurrentStep(state.currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (state.currentStep > 0) {
      state.setCurrentStep(state.currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    state.setLoading(true);
    state.setError('');
    
    try {
      const botData = {
        ...state.formData,
        exchange_id: state.selectedExchange.id
      };
      
      const response = await state.authenticatedFetch('/api/create-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botData)
      });
      
      if (response.ok) {
        const newBot = await response.json();
        onBotCreated(newBot);
        handleClose();
      } else {
        const errorData = await response.json();
        state.setError(errorData.message || 'Error creando bot');
      }
    } catch (error) {
      console.error('Error creating bot:', error);
      state.setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      state.setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden"
      >
        <BotCreationModalHeader
          currentStep={state.currentStep}
          steps={state.steps}
          onClose={handleClose}
          loading={state.loading}
        />

        {/* Main Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Error Display */}
          {state.error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300 text-sm">{state.error}</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          <BotCreationStepManager
            currentStep={state.currentStep}
            formData={state.formData}
            onInputChange={handleInputChange}
            userExchanges={state.userExchanges}
            selectedExchange={state.selectedExchange}
            onExchangeSelect={handleExchangeSelect}
            showAdvancedConfig={state.showAdvancedConfig}
            onToggleAdvanced={() => state.setShowAdvancedConfig(!state.showAdvancedConfig)}
            availableSymbols={state.availableSymbols}
            symbolsLoading={state.symbolsLoading}
            marketTypes={state.marketTypes}
            marketTypesLoading={state.marketTypesLoading}
            baseCurrencies={state.baseCurrencies}
            baseCurrenciesLoading={state.baseCurrenciesLoading}
            strategies={state.strategies}
            strategiesLoading={state.strategiesLoading}
            intervals={state.intervals}
            intervalsLoading={state.intervalsLoading}
            marginTypes={state.marginTypes}
            marginTypesLoading={state.marginTypesLoading}
            realTimeData={state.realTimeData}
            monetaryValues={state.monetaryValues}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            loading={state.loading}
          />
        </div>

        {/* Navigation Footer */}
        {state.currentStep < 3 && (
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/30">
            <div className="flex justify-between">
              <button
                onClick={handlePrevStep}
                disabled={state.currentStep === 0 || state.loading}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
              
              <button
                onClick={handleNextStep}
                disabled={state.loading || (state.currentStep === 0 && !state.selectedExchange)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Market Data Preview */}
        {state.selectedExchange && state.realTimeData && (
          <MarketDataPreview
            realTimeData={state.realTimeData}
            selectedExchange={state.selectedExchange}
            formData={state.formData}
          />
        )}
      </motion.div>
    </div>
  );
};

export default BotCreationModal;