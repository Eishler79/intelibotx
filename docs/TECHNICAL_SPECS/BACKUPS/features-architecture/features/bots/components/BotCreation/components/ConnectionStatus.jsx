import React from 'react';

const ConnectionStatus = ({ realTimeData }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'live': { color: 'text-green-400', bgColor: 'bg-green-400', label: 'EN VIVO', animate: 'animate-pulse' },
      'alternative': { color: 'text-blue-400', bgColor: 'bg-blue-400', label: 'ALTERNATIVO' },
      'cached': { color: 'text-yellow-400', bgColor: 'bg-yellow-400', label: 'CACHE' },
      'default': { color: 'text-red-400', bgColor: 'bg-red-400', label: 'ERROR' }
    };
    
    return configs[status] || configs['default'];
  };

  const statusConfig = getStatusConfig(realTimeData.priceStatus?.status);

  return (
    <div className="mt-3 pt-2 border-t border-gray-600/30">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Estado de conexión:</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusConfig.bgColor} ${statusConfig.animate || ''}`} />
          <span className={statusConfig.color}>
            {statusConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;