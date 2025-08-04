//src/pages/bots/BotsPanel.tsx
// ✅ Página: Panel de Bots
// Muestra el título, botón de creación y la lista de bots existentes

import React, { useState } from "react";
import { BotList } from "@/components/bots/BotList";
import { BotForm } from "@/components/bots/BotForm";
import { Button } from "@/components/ui/button";

const BotsPanel: React.FC = () => {
  // 🔁 Estado para mostrar u ocultar el formulario de creación
  const [showForm, setShowForm] = useState(false);

  // 🎯 Manejador para mostrar el formulario
  const handleCreateClick = () => {
    setShowForm(true);
  };

  // ❌ Manejador para cerrar el formulario
  const handleFormClose = () => {
    setShowForm(false);
  };

  return (
    <div className="p-6">
      {/* 🧠 Encabezado y botón */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">🤖 Gestión de Bots</h1>
        <Button onClick={handleCreateClick} className="text-white">
          + Crear Bot
        </Button>
      </div>

      {/* 📋 Formulario de creación de bot */}
      {showForm && <BotForm onClose={handleFormClose} />}

      {/* 📊 Lista de bots existentes */}
      <BotList />
    </div>
  );
};

export default BotsPanel;