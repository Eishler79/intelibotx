import React from 'react';
import { CheckCircle } from 'lucide-react';
import ConfigurationSummary from './components/ConfigurationSummary';
import RiskManagementSummary from './components/RiskManagementSummary';
import AdvancedConfigSummary from './components/AdvancedConfigSummary';
import ValidationMessages from './components/ValidationMessages';

const CreationReviewStep = ({
  formData = {},
  selectedExchange = null,
  realTimeData = null,
  monetaryValues = { tp: 0, sl: 0, risk: 0 },
  onSubmit,
  onCancel,
  loading = false,
  userExchanges = [],
  defaultValues = { symbol: 'BTCUSDT', market_type: 'SPOT', leverage: 1, stake: 100, take_profit: 2.5, stop_loss: 1.5 }
}) => {
  const isFormValid = formData.name && selectedExchange && formData.take_profit && formData.stop_loss;
  const hasExchanges = userExchanges.length > 0;
  const canSubmit = isFormValid && hasExchanges && !loading;

  return (
    <div className="creation-review-step space-y-6">
      <ConfigurationSummary
        formData={formData}
        selectedExchange={selectedExchange}
        defaultValues={defaultValues}
      />

      <RiskManagementSummary
        formData={formData}
        realTimeData={realTimeData}
        monetaryValues={monetaryValues}
        defaultValues={defaultValues}
      />

      <AdvancedConfigSummary formData={formData} />

      <div className="flex space-x-3 pt-6 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          disabled={loading}
        >
          Cancelar
        </button>
        
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={!canSubmit}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creando Bot...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Crear Bot
            </>
          )}
        </button>
      </div>

      <ValidationMessages
        formData={formData}
        selectedExchange={selectedExchange}
        userExchanges={userExchanges}
        loading={loading}
        canSubmit={canSubmit}
      />
    </div>
  );
};

export default CreationReviewStep;