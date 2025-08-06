//src/pages/bots/BotsPanel.tsx
// ✅ Página: Panel de Bots
// Muestra el título, botón de creación y la lista de bots existentes

import React, { useState, useEffect } from "react";
import { BotList } from "@/components/bots/BotList";
import { BotForm } from "@/components/bots/BotForm";
import { Button } from "@/components/ui/button";
import TradingHistory from "../../components/TradingHistory";

const BotsPanel: React.FC = () => {
  // 🔁 Estados para el panel
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('bots');
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const [bots, setBots] = useState([]);

  // Cargar bots disponibles
  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/real-bots`);
      const data = await response.json();
      setBots(Array.isArray(data) ? data : []);
      
      // Seleccionar primer bot por defecto para el historial
      if (Array.isArray(data) && data.length > 0 && !selectedBotId) {
        setSelectedBotId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading bots:', error);
      setBots([]);
    }
  };

  // 🎯 Manejador para mostrar el formulario
  const handleCreateClick = () => {
    setShowForm(true);
  };

  // ❌ Manejador para cerrar el formulario
  const handleFormClose = () => {
    setShowForm(false);
    loadBots(); // Recargar bots después de crear uno nuevo
  };

  const handleBotSelect = (botId: number) => {
    setSelectedBotId(botId);
    setActiveTab('history');
  };

  return (
    <div className="p-6">
      {/* 🧠 Encabezado y botón */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">🤖 Sistema de Trading Inteligente</h1>
        <Button onClick={handleCreateClick} className="text-white bg-blue-600 hover:bg-blue-700">
          + Crear Bot
        </Button>
      </div>

      {/* 📱 Tabs de navegación */}
      <div className="flex space-x-4 mb-6">
        <Button
          variant={activeTab === 'bots' ? 'default' : 'outline'}
          onClick={() => setActiveTab('bots')}
          className={activeTab === 'bots' ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-600 hover:text-white'}
        >
          Mis Bots ({bots.length})
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'outline'}
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-600 hover:text-white'}
          disabled={!selectedBotId}
        >
          Historial de Trading
        </Button>
      </div>

      {/* 📋 Formulario de creación de bot */}
      {showForm && <BotForm onClose={handleFormClose} />}

      {/* 📊 Contenido según tab activo */}
      {activeTab === 'bots' && (
        <div>
          <BotList onBotSelect={handleBotSelect} />
          
          {bots.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl mb-2">No hay bots creados</h3>
              <p className="mb-4">Crea tu primer bot para comenzar a hacer trading automático</p>
              <Button onClick={handleCreateClick} className="bg-blue-600 hover:bg-blue-700">
                Crear Primer Bot
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && selectedBotId && (
        <div>
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Historial de Trading</h3>
                <p className="text-gray-400">Bot ID: {selectedBotId}</p>
              </div>
              <div className="flex space-x-2">
                {bots.map((bot) => (
                  <Button
                    key={bot.id}
                    variant={selectedBotId === bot.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedBotId(bot.id)}
                    className={selectedBotId === bot.id 
                      ? 'bg-blue-600 text-white text-xs' 
                      : 'text-gray-300 border-gray-600 hover:text-white text-xs'
                    }
                  >
                    Bot {bot.id} ({bot.strategy})
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <TradingHistory botId={selectedBotId} />
        </div>
      )}

      {activeTab === 'history' && !selectedBotId && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl mb-2">Selecciona un Bot</h3>
          <p>Primero crea un bot para ver su historial de trading</p>
        </div>
      )}
    </div>
  );
};

export default BotsPanel;