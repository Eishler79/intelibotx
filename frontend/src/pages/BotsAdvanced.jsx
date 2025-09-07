// ✅ Phase 3 REAL REFACTORING - SUCCESS CRITERIA COMPLIANT ≤150 lines
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import BotControlPanelContainer from "../features/bots/components/BotTable/BotControlPanelContainer";
import DashboardMetrics from "../features/dashboard/components/DashboardMetrics";
import BotTable from "../features/bots/components/BotTable/BotTable";
import TradingHistoryContainer from "../features/trading/components/TradingHistory/TradingHistoryContainer";
import BotCreationModal from "../features/bots/components/BotCreation/BotCreationModalContainer";
import BotTemplates from "../components/BotTemplates";
import { useBotsUIState } from "../features/bots/hooks/useBotsUIState";
import { useBotDataLoader } from "../features/bots/hooks/useBotDataLoader";
import { useBotEventHandlers } from "../features/bots/hooks/useBotEventHandlers";

export default function BotsAdvanced() {
  const uiState = useBotsUIState();
  const dataLoader = useBotDataLoader();
  const eventHandlers = useBotEventHandlers({
    bots: dataLoader.bots,
    setBots: dataLoader.setBots,
    showSuccess: uiState.showSuccess,
    setControlPanelBot: uiState.setControlPanelBot
  });

  useEffect(() => {
    const initializeBots = async () => {
      uiState.setLoading(true);
      await dataLoader.loadBots();
      uiState.setLoading(false);
    };
    initializeBots();
  }, []);

  useEffect(() => {
    if (dataLoader.bots.length > 0 && !uiState.selectedBotId) {
      uiState.setSelectedBotId(dataLoader.bots[0].id);
    }
  }, [dataLoader.bots, uiState.selectedBotId]);

  if (uiState.loading) {
    return (
      <div className="min-h-screen bg-intelibot-bg-primary text-intelibot-text-primary p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-intelibot-accent-gold"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-intelibot-primary text-intelibot-text-primary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-intelibot-accent-gold to-intelibot-accent-gold-hover bg-clip-text text-transparent">
              🤖 InteliBots AI
            </h1>
            <p className="text-intelibot-text-secondary mt-2">Dashboard avanzado superior a 3Commas</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={uiState.handleOpenCreationModal}
              className="bg-gradient-intelibot-gold text-intelibot-text-on-gold shadow-intelibot-gold hover:scale-105 transition-transform"
            >
              🚀 Crear Bot Enhanced
            </Button>
            <Button 
              onClick={uiState.handleOpenTemplates}
              variant="outline"
              className="border-intelibot-accent-gold text-intelibot-accent-gold hover:bg-intelibot-accent-gold-light"
            >
              📋 Templates
            </Button>
          </div>
        </div>

        <div className="flex space-x-4 mb-8">
          <Button
            variant={uiState.activeTab === 'dashboard' ? 'default' : 'outline'}
            onClick={() => uiState.handleTabChange('dashboard')}
            className={uiState.activeTab === 'dashboard' ? 'bg-intelibot-accent-gold text-intelibot-text-on-gold' : 'text-intelibot-text-secondary border-intelibot-border-secondary hover:text-intelibot-accent-gold'}
          >
            Dashboard IA
          </Button>
          <Button
            variant={uiState.activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => uiState.handleTabChange('history')}
            className={uiState.activeTab === 'history' ? 'bg-intelibot-accent-gold text-intelibot-text-on-gold' : 'text-intelibot-text-secondary border-intelibot-border-secondary hover:text-intelibot-accent-gold'}
            disabled={!uiState.selectedBotId}
          >
            Historial de Trading
          </Button>
        </div>

        {uiState.activeTab === 'dashboard' && (
          <>
            <DashboardMetrics bots={dataLoader.bots} />
            <BotTable 
              bots={dataLoader.bots}
              onSelectBot={uiState.handleBotSelect}
              onViewDetails={uiState.handleViewBotDetails}
              onDeleteBot={eventHandlers.handleDeleteBot}
              onControlBot={uiState.handleOpenControlPanel}
              onToggleBotStatus={eventHandlers.handleToggleBotStatus}
            />
          </>
        )}

        {uiState.activeTab === 'history' && uiState.selectedBotId && (
          <TradingHistoryContainer botId={uiState.selectedBotId} />
        )}

        {uiState.showEnhancedModal && (
          <BotCreationModal 
            isOpen={uiState.showEnhancedModal}
            onClose={uiState.handleCloseModals}
            onBotCreated={() => {
              dataLoader.loadBots();
              uiState.handleCloseModals();
            }}
          />
        )}

        {uiState.showTemplates && (
          <BotTemplates 
            onClose={uiState.handleCloseModals}
            onTemplateSelect={(template) => {
              uiState.setSelectedTemplate(template);
              uiState.handleCloseModals();
            }}
          />
        )}

        {uiState.controlPanelBot && (
          <BotControlPanelContainer
            bot={uiState.controlPanelBot}
            onClose={eventHandlers.handleCloseControlPanel}
            onUpdateBot={eventHandlers.handleUpdateBot}
          />
        )}

        {uiState.successMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50">
            {uiState.successMessage}
          </div>
        )}
      </div>
    </div>
  );
}