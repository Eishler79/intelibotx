import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BasicBotConfig from '../BotControlPanel/BasicBotConfig';
import AdvancedBotConfig from '../BotControlPanel/AdvancedBotConfig';
import RiskManagementConfig from '../BotControlPanel/RiskManagementConfig';
import OrderTypesConfig from '../BotControlPanel/OrderTypesConfig';
import ValidationSummary from '../BotControlPanel/ValidationSummary';

export default function BotControlPanelContainer({ bot, onUpdateBot, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parameters, setParameters] = useState({});
  const [currentPrice, setCurrentPrice] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (bot?.parameters) {
      setParameters(bot.parameters);
    }
  }, [bot]);

  const handleUpdateBot = async (updatedBot) => {
    try {
      setIsLoading(true);
      setError(null);
      await onUpdateBot(updatedBot);
    } catch (err) {
      console.error('Error updating bot:', err);
      setError(err.message || 'Error al actualizar el bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleParametersChange = (newParameters) => {
    setParameters(prev => ({ ...prev, ...newParameters }));
  };

  const handleUpdateParameters = async () => {
    const updatedBot = { ...bot, parameters };
    await handleUpdateBot(updatedBot);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración del Bot: {bot?.name || 'Sin nombre'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              isLoading 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
          </div>
        )}

        <div className="overflow-y-auto max-h-[calc(100vh-8rem)]">
          <Card className="m-4 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Configuración del Bot</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant={activeTab === 'basic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('basic')}
                >
                  Básico
                </Button>
                <Button 
                  variant={activeTab === 'advanced' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('advanced')}
                >
                  Avanzado
                </Button>
                <Button 
                  variant={activeTab === 'risk' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('risk')}
                >
                  Riesgo
                </Button>
                <Button 
                  variant={activeTab === 'orders' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('orders')}
                >
                  Órdenes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'basic' && (
                <BasicBotConfig
                  bot={bot}
                  parameters={parameters}
                  onParametersChange={handleParametersChange}
                  currentPrice={currentPrice}
                />
              )}
              {activeTab === 'advanced' && (
                <AdvancedBotConfig
                  parameters={parameters}
                  onParametersChange={handleParametersChange}
                />
              )}
              {activeTab === 'risk' && (
                <RiskManagementConfig
                  parameters={parameters}
                  onParametersChange={handleParametersChange}
                  currentPrice={currentPrice}
                />
              )}
              {activeTab === 'orders' && (
                <OrderTypesConfig
                  parameters={parameters}
                  onParametersChange={handleParametersChange}
                />
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-700">
                <ValidationSummary
                  bot={bot}
                  parameters={parameters}
                  isUpdating={isLoading}
                  onUpdateParameters={handleUpdateParameters}
                  onClose={handleClose}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}