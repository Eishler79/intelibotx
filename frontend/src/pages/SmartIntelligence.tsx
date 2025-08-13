// ✅ DL-001 COMPLIANCE: SmartIntelligence component temporarily disabled
// Frontend scope reduction - Maintaining only core pages: Home, Dashboard, Bots, Users, Exchange

/*
import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ALL_INDICATORS = [
  "RSI",
  "MACD",
  "Ichimoku",
  "ADX",
  "VWAP",
  "BB",
  "SAR",
  "CMO",
  "ATR",
  "OBV",
];

export default function SmartIntelligence() {
  const [indicators, setIndicators] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_INDICATORS.map((i) => [i, true]))
  );
  const [smartSignals, setSmartSignals] = useState(true);

  const handleToggle = (key: string) => {
    setIndicators((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Card className="bg-[#0d1117] text-white border border-gray-700 shadow-xl p-4">
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🤖 Inteligencia Artificial
          </h2>
          <div className="flex items-center gap-2">
            <Label htmlFor="smartSignals">Señales inteligentes activadas</Label>
            <Switch
              id="smartSignals"
              checked={smartSignals}
              onCheckedChange={setSmartSignals}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {ALL_INDICATORS.map((indicator) => (
            <div key={indicator} className="flex items-center gap-2">
              <Label htmlFor={indicator}>{indicator}</Label>
              <Switch
                id={indicator}
                checked={indicators[indicator]}
                onCheckedChange={() => handleToggle(indicator)}
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button className="w-full bg-black hover:bg-gray-900 text-white">
            Ejecutar recomendación inteligente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
*/

// Placeholder component for future implementation
export default function SmartIntelligence() {
  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold mb-4">🚧 SmartIntelligence</h2>
      <p className="text-gray-600">Feature temporarily disabled for scope reduction</p>
    </div>
  );
}