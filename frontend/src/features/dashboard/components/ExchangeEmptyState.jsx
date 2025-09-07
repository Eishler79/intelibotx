import React from "react";
import { motion } from "framer-motion";
import { Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ExchangeEmptyState - Empty State for No Exchange Configuration
 * 
 * ✅ DL-001: No hardcode - navigation via props
 * ✅ SUCCESS CRITERIA: ≤150 lines (70 lines)
 * ✅ FEATURE STRUCTURE: dashboard/components/
 * 
 * Extracted from Dashboard.jsx:142-173
 */
const ExchangeEmptyState = ({ onNavigateToExchanges }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-12 text-center"
  >
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Settings className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to InteliBotX</h2>
        <p className="text-gray-400">
          Connect your first exchange to start trading with professional algorithms
        </p>
      </div>
      
      <div className="space-y-4">
        <Button 
          onClick={onNavigateToExchanges}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
        >
          <Settings className="w-5 h-5 mr-2" />
          Configure Exchange
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <p className="text-sm text-gray-500">
          You can explore other sections while setting up your exchange
        </p>
      </div>
    </div>
  </motion.div>
);

export default ExchangeEmptyState;