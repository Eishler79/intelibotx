# 🤖 Bot Templates & Strategies - InteliBotX Sistema Estratégico

## 📋 **CONTEXTO ESTRATÉGICO**
Este documento contiene las **configuraciones exactas** de los templates de bots de InteliBotX según la interfaz implementada. Esta información es **crítica** para el desarrollo futuro y **NO DEBE PERDERSE**.

---

## 🎯 **TEMPLATES DE BOTS IMPLEMENTADOS**

### **1. 🛡️ CONSERVADOR**
**Categoría**: Riesgo Bajo  
**Descripción**: Estrategia de bajo riesgo con take profits pequeños y stop losses ajustados

#### **Características Técnicas:**
- **Riesgo por operación**: 0.5%
- **R:R ratio**: 1.5:1
- **Mercado**: Solo SPOT
- **DCA**: Conservador (2 niveles)

#### **Configuración:**
- **TP**: 1.5% | **SL**: 1%
- **Leverage**: 1x | **Mercado**: SPOT

---

### **2. 🚀 AGRESIVO ALPHA**
**Categoría**: Riesgo Alto  
**Descripción**: Alta rentabilidad con mayor riesgo, ideal para traders experimentados

#### **Características Técnicas:**
- **Riesgo por operación**: 2.0%
- **R:R ratio**: 2:1
- **Mercado**: Futures con 3x leverage
- **DCA**: Agresivo (5 niveles)
- **Trailing stop**: Activado

#### **Configuración:**
- **TP**: 5% | **SL**: 2.5%
- **Leverage**: 3x | **Mercado**: FUTURES_USDT

---

### **3. ⚡ ULTRA SCALPER**
**Categoría**: Riesgo Medio  
**Descripción**: Movimientos rápidos con múltiples operaciones pequeñas

#### **Características Técnicas:**
- **Riesgo por operación**: 1.5%
- **R:R ratio**: 1.6:1
- **Timeframe**: 1 minuto
- **Operaciones**: Rápidas
- **DCA**: Sin DCA (1 nivel)

#### **Configuración:**
- **TP**: 0.8% | **SL**: 0.5%
- **Leverage**: 2x | **Mercado**: FUTURES_USDT

---

### **4. 🎯 FUTURES HUNTER**
**Categoría**: Riesgo Alto  
**Descripción**: Especializado en futures con alto apalancamiento controlado

#### **Características Técnicas:**
- **Riesgo por operación**: 1.8%
- **R:R ratio**: 2:1
- **Leverage**: 5x controlado
- **Mercado**: Futures USDT
- **Trailing stop**: Inteligente

#### **Configuración:**
- **TP**: 4% | **SL**: 2%
- **Leverage**: 5x | **Mercado**: FUTURES_USDT

---

### **5. 🕵️ MANIPULATION DETECTOR**
**Categoría**: Riesgo Medio  
**Descripción**: Detecta movimientos de ballenas y manipulación de mercado

#### **Características Técnicas:**
- **Riesgo por operación**: 1.5%
- **R:R ratio**: 1.94:1
- **Detección**: Anti-ballenas
- **Protección**: Contra manipulación
- **Timeframe**: 30 minutos

#### **Configuración:**
- **TP**: 3.5% | **SL**: 1.8%
- **Leverage**: 2x | **Mercado**: SPOT

---

### **6. 📰 NEWS SENTIMENT BOT**
**Categoría**: Riesgo Alto  
**Descripción**: Bot que opera basado en sentimiento de noticias y redes sociales

#### **Características Técnicas:**
- **Riesgo por operación**: 2.2%
- **R:R ratio**: 2:1
- **Análisis**: Noticias en tiempo real
- **Sentiment**: Redes sociales
- **Timeframe**: 1 hora

#### **Configuración:**
- **TP**: 5% | **SL**: 2.5%
- **Leverage**: 1x | **Mercado**: SPOT

---

## 🎨 **DISEÑO VISUAL IDENTIFICADO**

### **Códigos de Colores por Riesgo:**
- **Riesgo Bajo**: Verde (`#10B981` aprox)
- **Riesgo Medio**: Amarillo/Dorado (`#F59E0B` aprox)
- **Riesgo Alto**: Rojo/Coral (`#EF4444` aprox)

### **Elementos UI:**
- **Cards**: Fondo oscuro con bordes sutiles
- **Iconos específicos**: Cada template tiene emoji/icono único
- **Layout**: Grid 3x2 responsive
- **Badges**: Pills con color según nivel de riesgo

---

## 🔧 **ESPECIFICACIONES TÉCNICAS**

### **Estructura de Data:**
```typescript
interface BotTemplate {
  id: string;
  name: string;
  icon: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskColor: string;
  description: string;
  characteristics: string[];
  
  // Trading Config
  riskPerTrade: number;    // Porcentaje de riesgo por operación
  rrRatio: string;         // Risk:Reward ratio
  takeProfit: number;      // TP en porcentaje
  stopLoss: number;        // SL en porcentaje
  leverage: number;        // Apalancamiento
  marketType: 'SPOT' | 'FUTURES_USDT' | 'FUTURES_COIN';
  
  // Advanced Settings
  dcaLevels?: number;      // Niveles de DCA
  trailingStop?: boolean;  // Si tiene trailing stop
  timeframe?: string;      // Timeframe específico
}
```

### **Templates Array Completo:**
```javascript
export const BOT_TEMPLATES = [
  {
    id: 'conservador',
    name: 'Conservador',
    icon: '🛡️',
    riskLevel: 'low',
    riskColor: '#10B981',
    description: 'Estrategia de bajo riesgo con take profits pequeños y stop losses ajustados',
    characteristics: [
      'Riesgo: 0.5% por operación',
      'R:R ratio: 1.5:1', 
      'Solo mercado SPOT',
      'DCA conservador (2 niveles)'
    ],
    riskPerTrade: 0.5,
    rrRatio: '1.5:1',
    takeProfit: 1.5,
    stopLoss: 1.0,
    leverage: 1,
    marketType: 'SPOT',
    dcaLevels: 2
  },
  {
    id: 'agresivo-alpha',
    name: 'Agresivo Alpha',
    icon: '🚀',
    riskLevel: 'high',
    riskColor: '#EF4444',
    description: 'Alta rentabilidad con mayor riesgo, ideal para traders experimentados',
    characteristics: [
      'Riesgo: 2.0% por operación',
      'R:R ratio: 2:1',
      'Futures con 3x leverage',
      'DCA agresivo (5 niveles)',
      'Trailing stop activado'
    ],
    riskPerTrade: 2.0,
    rrRatio: '2:1',
    takeProfit: 5.0,
    stopLoss: 2.5,
    leverage: 3,
    marketType: 'FUTURES_USDT',
    dcaLevels: 5,
    trailingStop: true
  },
  {
    id: 'ultra-scalper',
    name: 'Ultra Scalper',
    icon: '⚡',
    riskLevel: 'medium',
    riskColor: '#F59E0B',
    description: 'Movimientos rápidos con múltiples operaciones pequeñas',
    characteristics: [
      'Riesgo: 1.5% por operación',
      'R:R ratio: 1.6:1',
      'Timeframe: 1 minuto',
      'Operaciones rápidas',
      'Sin DCA (1 nivel)'
    ],
    riskPerTrade: 1.5,
    rrRatio: '1.6:1',
    takeProfit: 0.8,
    stopLoss: 0.5,
    leverage: 2,
    marketType: 'FUTURES_USDT',
    dcaLevels: 1,
    timeframe: '1m'
  },
  {
    id: 'futures-hunter',
    name: 'Futures Hunter',
    icon: '🎯',
    riskLevel: 'high',
    riskColor: '#EF4444',
    description: 'Especializado en futures con alto apalancamiento controlado',
    characteristics: [
      'Riesgo: 1.8% por operación',
      'R:R ratio: 2:1',
      'Leverage: 5x controlado',
      'Futures USDT',
      'Trailing stop inteligente'
    ],
    riskPerTrade: 1.8,
    rrRatio: '2:1',
    takeProfit: 4.0,
    stopLoss: 2.0,
    leverage: 5,
    marketType: 'FUTURES_USDT',
    trailingStop: true
  },
  {
    id: 'manipulation-detector',
    name: 'Manipulation Detector',
    icon: '🕵️',
    riskLevel: 'medium',
    riskColor: '#F59E0B',
    description: 'Detecta movimientos de ballenas y manipulación de mercado',
    characteristics: [
      'Riesgo: 1.5% por operación',
      'R:R ratio: 1.94:1',
      'Detección anti-ballenas',
      'Protección contra manipulación',
      'Timeframe: 30 minutos'
    ],
    riskPerTrade: 1.5,
    rrRatio: '1.94:1',
    takeProfit: 3.5,
    stopLoss: 1.8,
    leverage: 2,
    marketType: 'SPOT',
    timeframe: '30m'
  },
  {
    id: 'news-sentiment-bot',
    name: 'News Sentiment Bot',
    icon: '📰',
    riskLevel: 'high',
    riskColor: '#EF4444',
    description: 'Bot que opera basado en sentimiento de noticias y redes sociales',
    characteristics: [
      'Riesgo: 2.2% por operación',
      'R:R ratio: 2:1',
      'Análisis de noticias en tiempo real',
      'Sentiment de redes sociales',
      'Timeframe: 1 hora'
    ],
    riskPerTrade: 2.2,
    rrRatio: '2:1',
    takeProfit: 5.0,
    stopLoss: 2.5,
    leverage: 1,
    marketType: 'SPOT',
    timeframe: '1h'
  }
];
```

---

## 🚀 **IMPLEMENTACIÓN FUTURA**

### **Fase 1**: Integración de Templates
- [ ] Implementar estructura de datos completa
- [ ] Conectar templates con creación de bots
- [ ] Aplicar validaciones específicas por template

### **Fase 2**: Lógica Avanzada
- [ ] Algoritmos específicos por strategy
- [ ] Backtesting automático de templates
- [ ] Performance tracking por template

### **Fase 3**: Personalización
- [ ] Templates customizables
- [ ] Templates creados por usuario
- [ ] Marketplace de templates

---

## 📊 **MÉTRICAS OBJETIVO POR TEMPLATE**

| Template | Win Rate Target | Max Drawdown | Timeframe Optimal |
|----------|-----------------|--------------|-------------------|
| Conservador | 70-80% | <5% | 15m-1h |
| Agresivo Alpha | 55-65% | <15% | 5m-15m |
| Ultra Scalper | 60-70% | <8% | 1m-5m |
| Futures Hunter | 50-60% | <20% | 5m-1h |
| Manipulation Detector | 65-75% | <10% | 30m-4h |
| News Sentiment Bot | 55-65% | <15% | 1h-4h |

---

## ⚠️ **IMPORTANTE - DOCUMENTACIÓN ESTRATÉGICA**

Este archivo contiene:
- ✅ **Especificaciones exactas** de cada template
- ✅ **Configuraciones técnicas** completas  
- ✅ **Estructura de datos** para implementación
- ✅ **Objetivos de performance** por estrategia
- ✅ **Roadmap de implementación** futura

**🚨 NO ELIMINAR**: Esta documentación es base para el desarrollo futuro del sistema de templates de InteliBotX.

---

> **Documento creado**: 10 Agosto 2025  
> **Para**: Eduard Guzmán - Sistema Templates InteliBotX  
> **Basado en**: Interface UI capturada de templates implementados  
> **Objetivo**: Preservar especificaciones estratégicas para desarrollo futuro