// ✅ DL-040 Phase 3: Bots Table Section Component
// EXTRACTED FROM: pages/BotsAdvanced.jsx:850-863 (Bots Table + Live Trading Section)
// RISK LEVEL: 10% - Component aggregation with behavior preservation

import React from "react";
import ProfessionalBotsTable from "@/components/ProfessionalBotsTable";
import LiveTradingFeed from "@/components/LiveTradingFeed";

/**
 * Bots Table Section Component
 * 
 * Aggregates bot management UI components:
 * - ProfessionalBotsTable: Bot CRUD operations and status management
 * - LiveTradingFeed: Real-time trading activity monitoring
 * 
 * This component serves as a container for bot-related functionality
 * in the dashboard, maintaining the same layout and behavior as
 * the original BotsAdvanced.jsx implementation.
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.bots - Array of bot objects from the API
 * @param {Function} props.onSelectBot - Handler for bot selection (history view)
 * @param {Function} props.onViewDetails - Handler for bot details modal
 * @param {Function} props.onDeleteBot - Handler for bot deletion
 * @param {Function} props.onControlBot - Handler for bot control panel
 * @param {Function} props.onToggleBotStatus - Handler for bot start/stop/pause
 */
export default function BotsTableSection({
  bots,
  onSelectBot,
  onViewDetails,
  onDeleteBot,
  onControlBot,
  onToggleBotStatus
}) {
  return (
    <>
      {/* Tabla Profesional de Bots DINÁMICA */}
      <ProfessionalBotsTable 
        bots={bots}
        onSelectBot={onSelectBot}
        onViewDetails={onViewDetails}
        onDeleteBot={onDeleteBot}
        onControlBot={onControlBot}
        onToggleBotStatus={onToggleBotStatus}
      />

      {/* Sección de Trading en Vivo */}
      <div className="mt-8">
        <LiveTradingFeed bots={bots} />
      </div>
    </>
  );
}