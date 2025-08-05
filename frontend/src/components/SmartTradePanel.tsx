// src/components/SmartTradePanel.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SmartTradePanel() {
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [amount, setAmount] = useState("20");
  const [orderType, setOrderType] = useState("LONG");
  const [takeProfit, setTakeProfit] = useState("1");
  const [stopLoss, setStopLoss] = useState("1");
  const [smartTradeActive, setSmartTradeActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [log, setLog] = useState("Esperando acción...");

  const handleExecute = async () => {
    setIsLoading(true);
    setLog("Ejecutando SmartTrade...");
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://intelibotx-api.up.railway.app";
      const response = await fetch(`${BASE_URL}/api/run-smart-trade/${symbol.replace("/", "")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();

      toast.success("🚀 SmartTrade ejecutado con éxito", {
        description: `Resultado: ${data.status || "OK"}`,
        duration: 4000,
      });
      setLog(`Resultado: ${JSON.stringify(data)}`);
    } catch (error) {
      toast.error("❌ Error al ejecutar SmartTrade", {
        description: "Inténtalo nuevamente o revisa la consola.",
      });
      setLog("Error al ejecutar SmartTrade.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0F1C] text-white py-10 px-4">
      <Card className="max-w-4xl mx-auto bg-[#131629] shadow-xl border border-slate-700 rounded-2xl">
        <CardContent className="p-8 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            ⚡ SmartTrade Inteligente
          </h2>

          <div className="flex items-center gap-4">
            <Label>SmartTrade activo:</Label>
            <Switch checked={smartTradeActive} onCheckedChange={setSmartTradeActive} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Par a operar</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="mt-1 bg-[#1e1f2b] border border-slate-600 text-white">
                  <SelectValue placeholder="Selecciona un par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                  <SelectItem value="PEPE/USDT">PEPE/USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Monto (USDT)</Label>
              <Input
                className="mt-1 bg-[#1e1f2b] border border-slate-600 text-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
              />
            </div>
          </div>

          <div>
            <Label>Tipo de orden</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="mt-1 bg-[#1e1f2b] border border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LONG">LONG</SelectItem>
                <SelectItem value="SHORT">SHORT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Take Profit (%)</Label>
              <Input
                className="mt-1 bg-[#1e1f2b] border border-slate-600 text-white"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                type="number"
              />
            </div>

            <div>
              <Label>Stop Loss (%)</Label>
              <Input
                className="mt-1 bg-[#1e1f2b] border border-slate-600 text-white"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                type="number"
              />
            </div>
          </div>

          <Button
            onClick={handleExecute}
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:opacity-90 text-white text-lg font-semibold"
          >
            {isLoading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
            🚀 Ejecutar SmartTrade
          </Button>

          <div className="bg-[#1e1f2b] p-4 rounded-md text-sm text-green-400 border border-slate-600 whitespace-pre-wrap">
            {log}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}