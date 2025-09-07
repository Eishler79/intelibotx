import React from 'react';
import ExchangeSelectionStep from './ExchangeSelectionStep';
import BasicCreationForm from './BasicCreationForm';
import AdvancedCreationForm from './AdvancedCreationForm';
import CreationReviewStep from './CreationReviewStep';

const BotCreationStepManager = ({
  currentStep,
  formData,
  onInputChange,
  userExchanges,
  selectedExchange,
  onExchangeSelect,
  showAdvancedConfig,
  onToggleAdvanced,
  availableSymbols,
  symbolsLoading,
  marketTypes,
  marketTypesLoading,
  baseCurrencies,
  baseCurrenciesLoading,
  strategies,
  strategiesLoading,
  intervals,
  intervalsLoading,
  marginTypes,
  marginTypesLoading,
  realTimeData,
  monetaryValues,
  onSubmit,
  onCancel,
  loading
}) => {
  const defaultValues = {
    symbol: 'BTCUSDT',
    market_type: 'SPOT',
    leverage: 1,
    stake: 100,
    take_profit: 2.5,
    stop_loss: 1.5,
    maxLeverage: 125
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ExchangeSelectionStep
            userExchanges={userExchanges}
            selectedExchange={selectedExchange}
            onExchangeSelect={onExchangeSelect}
          />
        );
      case 1:
        return (
          <BasicCreationForm
            formData={formData}
            onInputChange={onInputChange}
            availableSymbols={availableSymbols}
            symbolsLoading={symbolsLoading}
            marketTypes={marketTypes}
            marketTypesLoading={marketTypesLoading}
            baseCurrencies={baseCurrencies}
            baseCurrenciesLoading={baseCurrenciesLoading}
            strategies={strategies}
            strategiesLoading={strategiesLoading}
            selectedExchange={selectedExchange}
            realTimeData={realTimeData}
            monetaryValues={monetaryValues}
            defaultValues={defaultValues}
          />
        );
      case 2:
        return (
          <AdvancedCreationForm
            formData={formData}
            onInputChange={onInputChange}
            showAdvancedConfig={showAdvancedConfig}
            onToggleAdvanced={onToggleAdvanced}
            intervals={intervals}
            intervalsLoading={intervalsLoading}
            marginTypes={marginTypes}
            marginTypesLoading={marginTypesLoading}
            selectedExchange={selectedExchange}
          />
        );
      case 3:
        return (
          <CreationReviewStep
            formData={formData}
            selectedExchange={selectedExchange}
            realTimeData={realTimeData}
            monetaryValues={monetaryValues}
            onSubmit={onSubmit}
            onCancel={onCancel}
            loading={loading}
            userExchanges={userExchanges}
            defaultValues={defaultValues}
          />
        );
      default:
        return null;
    }
  };

  return renderStepContent();
};

export default BotCreationStepManager;