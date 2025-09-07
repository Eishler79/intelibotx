import React from 'react';

// Specialized hooks for Bot Único templates
import { useBotUniqueTemplates } from '../features/bots/hooks/useBotUniqueTemplates';
import { useBotTemplateSelection } from '../features/bots/hooks/useBotTemplateSelection';
import { useBotTemplateRisk } from '../features/bots/hooks/useBotTemplateRisk';

// Specialized components
import BotTemplateModal from '../features/bots/components/BotTemplateModal';
import BotUniqueTemplateCard from '../features/bots/components/BotUniqueTemplateCard';
import BotTemplateDetail from '../features/bots/components/BotTemplateDetail';

const BotTemplates = ({ isOpen, onSelectTemplate, onClose }) => {
  // 🤖 Bot Único specialized hooks integration
  const { templates, loading, error } = useBotUniqueTemplates();
  const { selectedTemplate, selectTemplate, applyTemplate } = useBotTemplateSelection();
  const { getRiskLevel, getOperationalModesDisplay } = useBotTemplateRisk();


  const handleApplyTemplate = () => {
    applyTemplate(onSelectTemplate);
  };

  // Loading state
  if (loading) {
    return (
      <BotTemplateModal isOpen={isOpen} onClose={onClose}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-400">Cargando templates Bot Único...</span>
        </div>
      </BotTemplateModal>
    );
  }

  // Error state
  if (error) {
    return (
      <BotTemplateModal isOpen={isOpen} onClose={onClose}>
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">Error cargando templates: {error}</p>
          <p className="text-gray-400 text-sm">
            Los templates Bot Único requieren conexión con el servidor.
            Por favor, verifica tu conexión e inténtalo nuevamente.
          </p>
        </div>
      </BotTemplateModal>
    );
  }

  return (
    <BotTemplateModal isOpen={isOpen} onClose={onClose}>

        {/* Bot Único Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {templates.map((template) => {
            const riskInfo = getRiskLevel(template);
            const operationalModes = getOperationalModesDisplay(template.initial_config.preferred_modes);
            const isSelected = selectedTemplate?.id === template.id;
            
            return (
              <BotUniqueTemplateCard
                key={template.id}
                template={template}
                isSelected={isSelected}
                onSelect={selectTemplate}
                riskInfo={riskInfo}
                operationalModes={operationalModes}
              />
            );
          })}
        </div>

        {/* Bot Único Template Detail */}
        {selectedTemplate && (
          <BotTemplateDetail
            selectedTemplate={selectedTemplate}
            riskInfo={getRiskLevel(selectedTemplate)}
            operationalModes={getOperationalModesDisplay(selectedTemplate.initial_config.preferred_modes)}
          />
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {selectedTemplate ? 
              `🤖 Crear Bot Único: ${selectedTemplate.name}` : 
              'Selecciona una Configuración Inicial'
            }
          </button>
        </div>
      </BotTemplateModal>
  );
};

export default BotTemplates;