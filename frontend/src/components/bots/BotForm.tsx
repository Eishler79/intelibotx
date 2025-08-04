// ✅ Componente: BotForm.tsx
// Muestra el formulario para crear un nuevo bot con selectores personalizados y configuración avanzada

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBot } from "@/services/api";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Props {
  onClose: () => void;
}

export const BotForm: React.FC<Props> = ({ onClose }) => {
  // 🧠 Estados básicos
  const [symbol, setSymbol] = useState("");
  const [strategy, setStrategy] = useState("clasica");
  const [accountType, setAccountType] = useState("spot");

  // ⚙️ Configuración avanzada
  const [capitalInicial, setCapitalInicial] = useState("100");
  const [takeProfit, setTakeProfit] = useState("2.5");
  const [stopLoss, setStopLoss] = useState("5");
  const [trailingTP, setTrailingTP] = useState("0.2");
  const [dcaOrdenes, setDcaOrdenes] = useState("3");
  const [dcaDesviacion, setDcaDesviacion] = useState("2.5");

  // 🚀 Envío del formulario
  const handleSubmit = async () => {
    await createBot({
      symbol,
      strategy,
      account_type: accountType,
      capital_inicial: parseFloat(capitalInicial),
      take_profit: parseFloat(takeProfit),
      stop_loss: parseFloat(stopLoss),
      trailing_tp: parseFloat(trailingTP),
      dca_ordenes: parseInt(dcaOrdenes),
      dca_desviacion: parseFloat(dcaDesviacion),
    });
    onClose();
  };

  return (
    <div className="bg-muted p-4 rounded-xl shadow mb-4">
      {/* 🧾 Título */}
      <h2 className="text-xl font-bold mb-4 text-white">📋 Crear Nuevo Bot</h2>

      {/* 🔹 Sección: Datos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campo símbolo */}
        <Input
          placeholder="Símbolo (ej: ETHUSDT)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />

        {/* Select estrategia */}
        <Select onValueChange={setStrategy} defaultValue={strategy}>
          <SelectTrigger>
            <SelectValue placeholder="Estrategia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clasica">Clásica</SelectItem>
            <SelectItem value="smart_v1">Smart v1</SelectItem>
          </SelectContent>
        </Select>

        {/* Select tipo de cuenta */}
        <Select onValueChange={setAccountType} defaultValue={accountType}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spot">Spot</SelectItem>
            <SelectItem value="futures">Futures</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ⚙️ Sección: Configuración avanzada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-white">
        <Input
          type="number"
          step="0.01"
          value={capitalInicial}
          onChange={(e) => setCapitalInicial(e.target.value)}
          placeholder="Capital Inicial (ej: 100 USDT)"
        />
        <Input
          type="number"
          step="0.1"
          value={takeProfit}
          onChange={(e) => setTakeProfit(e.target.value)}
          placeholder="Take Profit (%)"
        />
        <Input
          type="number"
          step="0.1"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value)}
          placeholder="Stop Loss (%)"
        />
        <Input
          type="number"
          step="0.1"
          value={trailingTP}
          onChange={(e) => setTrailingTP(e.target.value)}
          placeholder="Trailing TP (%)"
        />
        <Input
          type="number"
          value={dcaOrdenes}
          onChange={(e) => setDcaOrdenes(e.target.value)}
          placeholder="Órdenes DCA"
        />
        <Input
          type="number"
          step="0.1"
          value={dcaDesviacion}
          onChange={(e) => setDcaDesviacion(e.target.value)}
          placeholder="Desviación DCA (%)"
        />
      </div>

      {/* 🎯 Acciones */}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="bg-green-600 text-white">
          Crear Bot
        </Button>
      </div>
    </div>
  );
};