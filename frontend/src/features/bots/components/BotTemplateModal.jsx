/**
 * 🖼️ BotTemplateModal - Componente especializado para modal wrapper Bot Único templates
 * 
 * SPEC_REF: DL-077 Bot Único Templates Architecture Pattern
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';

export default function BotTemplateModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                🤖 Templates Bot Único
              </h2>
              <p className="text-gray-400">
                Selecciona una configuración inicial para tu Bot Único adaptativo
              </p>
              <p className="text-gray-500 text-sm mt-1">
                El bot se adaptará automáticamente según las condiciones del mercado
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}