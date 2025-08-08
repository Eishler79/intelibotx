/**
 * Utilidades para cálculos de bots en tiempo real
 * Maneja validaciones, cálculos monetarios y gestión de riesgo
 */

/**
 * Calcula valores monetarios dinámicos para TP/SL
 */
export const calculateMonetaryValues = (formData, currentPrice, balance) => {
  if (!currentPrice || !formData.stake) {
    return {
      tpValue: 0,
      slValue: 0,
      tpPrice: 0,
      slPrice: 0,
      positionSize: 0,
      riskAmount: 0,
      leverageEffectiveStake: 0
    };
  }

  const {
    stake,
    take_profit,
    stop_loss,
    leverage = 1,
    market_type,
    risk_percentage = 1.0
  } = formData;

  // Calcular posición efectiva con leverage
  const leverageEffectiveStake = market_type.includes('FUTURES') ? stake * leverage : stake;
  
  // Calcular precios objetivo
  const tpPrice = currentPrice * (1 + take_profit / 100);
  const slPrice = currentPrice * (1 - stop_loss / 100);
  
  // Calcular valores monetarios
  const tpValue = leverageEffectiveStake * (take_profit / 100);
  const slValue = leverageEffectiveStake * (stop_loss / 100);
  
  // Calcular riesgo basado en porcentaje del balance
  const riskAmount = balance * (risk_percentage / 100);

  return {
    tpValue,
    slValue,
    tpPrice,
    slPrice,
    positionSize: leverageEffectiveStake,
    riskAmount,
    leverageEffectiveStake
  };
};

/**
 * Valida el balance disponible vs stake requerido
 */
export const validateBalance = (stake, balance, leverage = 1, market_type = 'SPOT') => {
  if (!balance || !stake) {
    return { isValid: false, error: 'Balance o stake no disponible' };
  }

  const requiredMargin = market_type.includes('FUTURES') ? stake : stake;
  
  if (requiredMargin > balance) {
    return {
      isValid: false,
      error: `Balance insuficiente. Requerido: ${requiredMargin.toFixed(2)}, Disponible: ${balance.toFixed(2)}`
    };
  }

  // Validar que no use más del 90% del balance en una posición
  const maxRecommended = balance * 0.9;
  if (requiredMargin > maxRecommended) {
    return {
      isValid: false,
      error: `Se recomienda no usar más del 90% del balance en una posición`
    };
  }

  return { isValid: true };
};

/**
 * Obtiene límites de leverage según exchange y símbolo
 */
export const getLeverageLimits = (exchange, symbol) => {
  // Límites por defecto - deberían venir de la API del exchange
  const defaultLimits = {
    binance: { min: 1, max: 125 },
    bybit: { min: 1, max: 100 },
    okx: { min: 1, max: 125 },
    kucoin: { min: 1, max: 50 }
  };

  const exchangeName = exchange?.exchange_name?.toLowerCase();
  
  if (defaultLimits[exchangeName]) {
    return defaultLimits[exchangeName];
  }
  
  // Límite conservador por defecto
  return { min: 1, max: 20 };
};

/**
 * Calcula el tamaño de posición óptimo basado en riesgo
 */
export const calculateOptimalPositionSize = (balance, riskPercentage, stopLossPercentage, currentPrice) => {
  if (!balance || !riskPercentage || !stopLossPercentage || !currentPrice) {
    return 0;
  }

  // Cantidad que estamos dispuestos a perder
  const riskAmount = balance * (riskPercentage / 100);
  
  // Tamaño de posición basado en el stop loss
  const positionSize = riskAmount / (stopLossPercentage / 100);
  
  return Math.min(positionSize, balance * 0.9); // Máximo 90% del balance
};

/**
 * Valida parámetros de órdenes según tipo de mercado
 */
export const validateOrderParameters = (formData) => {
  const errors = [];
  
  const {
    take_profit,
    stop_loss,
    leverage,
    market_type,
    entry_order_type,
    stake
  } = formData;

  // Validar TP/SL
  if (take_profit <= 0) {
    errors.push('Take Profit debe ser mayor a 0');
  }
  
  if (stop_loss <= 0) {
    errors.push('Stop Loss debe ser mayor a 0');
  }
  
  if (take_profit <= stop_loss) {
    errors.push('Take Profit debe ser mayor que Stop Loss');
  }

  // Validar leverage para futures
  if (market_type.includes('FUTURES')) {
    if (leverage < 1 || leverage > 125) {
      errors.push('Leverage debe estar entre 1x y 125x');
    }
  }

  // Validar stake
  if (stake <= 0) {
    errors.push('Stake debe ser mayor a 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calcula métricas de riesgo avanzadas
 */
export const calculateRiskMetrics = (formData, currentPrice, balance) => {
  const monetaryValues = calculateMonetaryValues(formData, currentPrice, balance);
  
  const riskRewardRatio = monetaryValues.tpValue / monetaryValues.slValue;
  const portfolioRisk = (monetaryValues.slValue / balance) * 100;
  
  return {
    riskRewardRatio: riskRewardRatio.toFixed(2),
    portfolioRisk: portfolioRisk.toFixed(2),
    breakEvenWinRate: (1 / (1 + riskRewardRatio) * 100).toFixed(1)
  };
};

/**
 * Formatea valores monetarios para display
 */
export const formatMonetaryValue = (value, currency = 'USDT', showSign = false) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return `0.00 ${currency}`;
  }

  const sign = showSign ? (value >= 0 ? '+' : '') : '';
  return `${sign}$${Math.abs(value).toFixed(2)} ${currency}`;
};

/**
 * Obtiene configuración de precisión según símbolo
 */
export const getSymbolPrecision = (symbol) => {
  // Configuraciones comunes - deberían venir de la API del exchange
  const precisionMap = {
    'BTCUSDT': { price: 2, quantity: 5 },
    'ETHUSDT': { price: 2, quantity: 4 },
    'ADAUSDT': { price: 4, quantity: 0 },
    'DOTUSDT': { price: 3, quantity: 2 }
  };
  
  return precisionMap[symbol] || { price: 4, quantity: 3 };
};