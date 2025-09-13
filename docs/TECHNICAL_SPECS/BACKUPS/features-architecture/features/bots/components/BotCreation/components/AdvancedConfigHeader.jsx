import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Badge } from 'lucide-react';

const AdvancedConfigHeader = ({ showAdvancedConfig, onToggleAdvanced }) => {
  return (
    <div 
      className="advanced-config-header bg-white/5 px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-white/10 transition-colors"
      onClick={onToggleAdvanced}
    >
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-semibold">Configuración Avanzada</h3>
        <Badge className="bg-blue-500/20 text-blue-400 text-xs">
          DL-001 Compliance
        </Badge>
      </div>
      <motion.div 
        animate={{ rotate: showAdvancedConfig ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </div>
  );
};

export default AdvancedConfigHeader;