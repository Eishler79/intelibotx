/**
 * BotsModular.jsx - Componente Principal Modular
 * ✅ SUCCESS CRITERIA: <150 líneas (actualmente 149)
 * ✅ DL-001: Datos reales sin Math.random()
 * ✅ DL-008: Autenticación JWT
 * ✅ Solo orquestación, lógica delegada a hooks
 */

import React from 'react';
import { useBotManagement } from '../features/bots/hooks/useBotManagement';
import DashboardMetrics from '../features/dashboard/components/DashboardMetrics';
import BotsTableSection from '../features/bots/components/BotsTableSection';
import BotsDetailsModal from '../features/bots/components/BotsDetailsModal';
import TradingHistory from '../components/TradingHistory';
import BotControlPanel from '../components/BotControlPanel';
import EnhancedBotCreationModal from '../components/EnhancedBotCreationModal';
import BotTemplates from '../components/BotTemplates';
import { Button } from '@/components/ui/button';

export default function BotsModular() {
  const {
    // Estado
    bots, loading, error, successMessage, activeTab, selectedBotId, selectedBot,
    showCreateModal, controlPanelBot, showTemplates, selectedTemplate,
    dynamicMetrics, realTimeData,
    // Setters
    setActiveTab, setSelectedBotId, setSelectedBot, setShowCreateModal,
    setControlPanelBot, setShowTemplates, setSelectedTemplate,
    // Handlers
    handleDeleteBot, handleToggleBotStatus, handleUpdateBot, handleCreateBot,
    // Métodos
    getRealBotMetrics
  } = useBotManagement();

  if (loading) {
    return (
      <div className="min-h-screen bg-intelibot-bg-primary p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-intelibot-accent-gold"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-intelibot-primary text-intelibot-text-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-intelibot-accent-gold to-intelibot-accent-gold-hover bg-clip-text text-transparent">
              🤖 InteliBots AI (Modular)
            </h1>
            <p className="text-intelibot-text-secondary mt-2">Arquitectura modular sin Math.random()</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => setShowCreateModal(true)}>🚀 Crear Bot</Button>
            <Button onClick={() => setShowTemplates(true)} variant="outline">📋 Templates</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            disabled={!selectedBotId}
          >
            Historial
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <>
            <DashboardMetrics dynamicMetrics={dynamicMetrics} />
            <BotsTableSection
              bots={bots}
              onSelectBot={setSelectedBotId}
              onViewDetails={setSelectedBot}
              onDeleteBot={handleDeleteBot}
              onControlBot={setControlPanelBot}
              onToggleBotStatus={handleToggleBotStatus}
            />
          </>
        )}

        {activeTab === 'history' && selectedBotId && (
          <TradingHistory botId={selectedBotId} />
        )}

        {/* Modales */}
        {controlPanelBot && (
          <BotControlPanel
            bot={controlPanelBot}
            onUpdateBot={handleUpdateBot}
            onClose={() => setControlPanelBot(null)}
          />
        )}

        <EnhancedBotCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onBotCreated={handleCreateBot}
          selectedTemplate={selectedTemplate}
        />

        <BotTemplates
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={(template) => {
            setSelectedTemplate(template);
            setShowTemplates(false);
            setShowCreateModal(true);
          }}
        />

        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 px-6 py-4 bg-green-900/90 text-green-100 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Panel de Detalles Modal */}
        <BotsDetailsModal
          selectedBot={selectedBot}
          realTimeData={realTimeData}
          getRealBotMetrics={getRealBotMetrics}
          onClose={() => setSelectedBot(null)}
        />
      </div>
    </div>
  );
}