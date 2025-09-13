import React from 'react';
import { X } from 'lucide-react';

const BotCreationModalHeader = ({ 
  currentStep, 
  steps, 
  onClose, 
  loading 
}) => {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800/50">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Crear Nuevo Bot Inteligente
          </h2>
          <p className="text-gray-400 mt-1">
            Paso {currentStep + 1} de {steps.length}: {steps[currentStep]}
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={loading}
          className={`p-2 rounded-lg transition-colors ${
            loading 
              ? 'text-gray-600 cursor-not-allowed' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-gray-800/30">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                index <= currentStep ? 'text-blue-400' : 'text-gray-500'
              }`}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-4 rounded ${
                  index < currentStep ? 'bg-blue-500' : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default BotCreationModalHeader;