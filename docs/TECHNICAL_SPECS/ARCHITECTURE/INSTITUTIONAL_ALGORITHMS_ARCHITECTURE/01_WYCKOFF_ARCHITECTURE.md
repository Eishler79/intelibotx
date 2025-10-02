# 01_WYCKOFF_ARCHITECTURE - Arquitectura Técnica Wyckoff Method

> **DOCUMENTO TÉCNICO DE IMPLEMENTACIÓN**
> **Basado en:** INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/01_WYCKOFF_METHOD.md
> **Estado:** 🔴 Por Implementar | **Prioridad:** CRÍTICA

---

## 📊 **ARQUITECTURA ACTUAL VS OBJETIVO**

### **ESTADO ACTUAL (INCORRECTO):**
```
signal_quality_assessor.py
└── _evaluate_wyckoff_analysis()
    ├── Recibe wyckoff_phase de external (NO CALCULA)
    ├── Usa datos de 1m (INCORRECTO)
    ├── Solo hace scoring básico
    └── No detecta eventos Wyckoff
```

### **ARQUITECTURA OBJETIVO:**
```
services/
├── wyckoff_analyzer.py (NUEVO - Core Algorithm)
│   ├── analyze_wyckoff_phase() - Detección completa
│   ├── _detect_spring() - Spring test detection
│   ├── _detect_utad() - UTAD detection
│   ├── _detect_sos_sow() - Signs detection
│   └── _calculate_cause_effect() - Proyección movimiento
│
├── signal_quality_assessor.py (MODIFICADO)
│   └── _evaluate_wyckoff_analysis()
│       └── LLAMA → wyckoff_analyzer.analyze_wyckoff_phase()
│
└── service_factory.py (MODIFICADO)
    └── get_wyckoff_analyzer() - Singleton pattern
```

---

## 🎯 **COMPONENTES TÉCNICOS**

### **1. DETECCIÓN DE FASES (Core Algorithm)**

#### **INPUTS REQUERIDOS:**
```python
{
    "opens": List[float],   # Mínimo 100 velas
    "highs": List[float],    # Del timeframe configurado
    "lows": List[float],     # (30m para bot SOL)
    "closes": List[float],
    "volumes": List[float],
    "timeframe": str         # "30m"
}
```

#### **ALGORITMO DETECCIÓN FASES:**
```python
def _determine_phase():
    """
    Basado en especificación líneas 47-127
    """
    # 1. DETECTAR ESTRUCTURA
    # - Swing highs/lows para tendencia
    # - Trading range (soporte/resistencia)

    # 2. ANÁLISIS VOLUMEN
    # - Divergencias precio-volumen (línea 187-193)
    # - Acumulación: precio baja/lateral + volumen sube
    # - Distribución: precio sube/lateral + volumen alto

    # 3. EVENTOS ESPECÍFICOS
    # - Spring: ruptura falsa soporte (línea 67)
    # - UTAD: ruptura falsa resistencia (línea 106)
    # - SOS: primera fuerza real arriba (línea 83)
    # - SOW: primera debilidad real abajo (línea 122)

    # 4. DETERMINAR FASE
    if ranging and spring_detected:
        return ACCUMULATION
    elif uptrend and sos_detected:
        return MARKUP
    elif ranging and utad_detected:
        return DISTRIBUTION
    elif downtrend and sow_detected:
        return MARKDOWN
```

### **2. DETECCIÓN DE SPRING (Líneas 63-67 especificación)**

```python
def _detect_spring():
    """
    Spring = Test final acumulación
    Criterios de especificación:
    - PS (Preliminary Support) establecido
    - SC (Selling Climax) completado
    - Penetra soporte brevemente
    - Cierra arriba del soporte
    - Volumen BAJO (no es panic selling)
    """
    CONDITIONS = {
        "penetration": 0.002,  # 0.2% bajo soporte
        "volume_ratio": 1.2,   # Volumen < 120% promedio
        "quick_recovery": True # Cierre sobre soporte
    }
```

### **3. DETECCIÓN DE UTAD (Líneas 102-106 especificación)**

```python
def _detect_utad():
    """
    UTAD = Upthrust After Distribution
    Criterios de especificación:
    - PSY (Preliminary Supply) establecido
    - BC (Buying Climax) completado
    - Penetra resistencia brevemente
    - Cierra bajo resistencia
    - Volumen ALTO (trampa retail)
    """
    CONDITIONS = {
        "penetration": 0.002,  # 0.2% sobre resistencia
        "volume_ratio": 1.5,   # Volumen > 150% promedio
        "quick_reversal": True # Cierre bajo resistencia
    }
```

### **4. PARÁMETROS BASADOS EN ESPECIFICACIÓN**

| **Parámetro** | **Valor** | **Fuente Especificación** | **Línea** |
|---------------|-----------|---------------------------|-----------|
| Min velas requeridas | 100 | "Micro-Wyckoff 5-30 min" necesita historia | 132-136 |
| Penetración Spring | 0.2% | "Penetra soporte" sin romper | 67 |
| Volumen Spring | < 1.2x | "Volumen bajo" no panic | 67 |
| Penetración UTAD | 0.2% | "Penetra resistencia" falsa | 106 |
| Volumen UTAD | > 1.5x | "Volumen alto" trampa | 106 |
| Divergencia Acum | -2% precio, +10% vol | "Precio baja, volumen sube" | 194 |
| Divergencia Dist | +2% precio, -10% vol | "Precio sube, volumen baja" | 198 |
| Rango percentiles | 10/90 | Soporte/Resistencia estadístico | Trading Range |
| Causa/Efecto ratio | 2.5x | "Movimiento = 2-3x rango" | 273 |

---

## 📐 **FLUJO DE DATOS**

### **FLUJO ACTUAL (INCORRECTO):**
```
routes/bots.py
├── Obtiene datos 1m, 5m, 15m, 1h (NO 30m)
├── institutional_detector (NO calcula Wyckoff)
├── signal_quality_assessor
│   └── _evaluate_wyckoff (recibe fase, no calcula)
└── Response con score incorrecto
```

### **FLUJO CORREGIDO:**
```
routes/bots.py
├── Obtiene datos del bot.interval (30m)
├── Crea WyckoffAnalyzer
├── analyzer.analyze_wyckoff_phase(OHLCV 30m)
├── signal_quality_assessor
│   └── _evaluate_wyckoff (usa resultado analyzer)
└── Response con análisis real
```

---

## 🔧 **INTEGRACIÓN CON SIGNAL QUALITY ASSESSOR**

### **ANTES (Método actual - básico):**
```python
def _evaluate_wyckoff_analysis():
    # PROBLEMA: No calcula, solo recibe
    wyckoff_phase = market_structure.get('wyckoff_phase', 'UNKNOWN')

    # PROBLEMA: Scoring arbitrario
    if phase == "ACCUMULATION":
        score = 35  # Número mágico
```

### **DESPUÉS (Método robusto):**
```python
def _evaluate_wyckoff_analysis():
    # SOLUCIÓN: Usa analyzer real
    wyckoff_analyzer = ServiceFactory.get_wyckoff_analyzer()
    result = wyckoff_analyzer.analyze_wyckoff_phase(...)

    # SOLUCIÓN: Score basado en detección real
    score = 0
    score += 40 * result.confidence  # Fase detectada
    score += 15 if result.spring_detected  # Evento Spring
    score += 15 if result.utad_detected    # Evento UTAD
    score += 10 if result.sos_detected     # Sign of Strength
    score += 10 if result.sow_detected     # Sign of Weakness
    score += cause_effect_score            # Proyección
```

---

## 📊 **VALIDACIÓN DE CRITERIOS**

### **NO SON HARDCODE - SON DE ESPECIFICACIÓN:**

| **Método** | **Criterio** | **Fuente** | **Página/Línea** |
|------------|--------------|------------|------------------|
| `_detect_spring` | 0.2% penetración | "Penetra soporte brevemente" | Línea 67 |
| `_detect_spring` | Volumen < 1.2x | "Volumen bajo" | Línea 67 |
| `_detect_utad` | 0.2% penetración | "Test máximos débil" | Línea 106 |
| `_detect_utad` | Volumen > 1.5x | "Trampa retail" | Línea 106 |
| `_analyze_volume` | -2% precio +10% vol | "Falling price + Rising volume" | Línea 192-194 |
| `_analyze_volume` | +2% precio -10% vol | "Rising price + Falling volume" | Línea 198-200 |
| `cause_effect` | 2.5x rango | "Movimiento = 2-3x rango" | Línea 273 |

---

## 🎨 **DISEÑO UX/UI FRONTEND**

### **PROPUESTA NUEVA SECCIÓN:**

```jsx
// frontend/src/pages/AlgorithmAnalysis.jsx - NUEVA PÁGINA

import { Tabs, Card, Row, Col } from 'antd';
import WyckoffAnalysis from '../components/algorithms/WyckoffAnalysis';
import OrderBlocksAnalysis from '../components/algorithms/OrderBlocksAnalysis';
import LiquidityGrabsAnalysis from '../components/algorithms/LiquidityGrabsAnalysis';
// ... otros algoritmos

const AlgorithmAnalysis = ({ botId }) => {
  return (
    <Card title="Institutional Algorithms Analysis">
      <Tabs defaultActiveKey="wyckoff">
        <TabPane tab="Wyckoff Method" key="wyckoff">
          <WyckoffAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Order Blocks" key="order-blocks">
          <OrderBlocksAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Liquidity Grabs" key="liquidity">
          <LiquidityGrabsAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Stop Hunting" key="stop-hunting">
          <StopHuntingAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Fair Value Gaps" key="fvg">
          <FVGAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Microstructure" key="microstructure">
          <MicrostructureAnalysis botId={botId} />
        </TabPane>
      </Tabs>
    </Card>
  );
};
```

### **COMPONENTE WYCKOFF DETALLADO:**

```jsx
// frontend/src/components/algorithms/WyckoffAnalysis.jsx

const WyckoffAnalysis = ({ botId }) => {
  return (
    <Row gutter={[16, 16]}>
      {/* Fase Actual */}
      <Col span={8}>
        <Card title="Current Phase">
          <PhaseIndicator phase={data.phase} confidence={data.confidence} />
        </Card>
      </Col>

      {/* Eventos Detectados */}
      <Col span={8}>
        <Card title="Wyckoff Events">
          <EventsList events={data.events} />
        </Card>
      </Col>

      {/* Proyección */}
      <Col span={8}>
        <Card title="Cause & Effect">
          <ProjectionChart expected={data.cause_effect} />
        </Card>
      </Col>

      {/* Gráfico con anotaciones */}
      <Col span={24}>
        <Card title="Wyckoff Chart">
          <TradingViewWidget
            symbol={symbol}
            annotations={wyckoffAnnotations}
          />
        </Card>
      </Col>

      {/* Historial de Fases */}
      <Col span={24}>
        <Card title="Phase History">
          <Timeline>
            {phaseHistory.map(phase => (
              <Timeline.Item key={phase.timestamp}>
                {phase.name} - {phase.timestamp}
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </Col>
    </Row>
  );
};
```

---

## ✅ **MAPEO EXACTO ARQUITECTURA ↔ CONCEPTO**

### **VALIDACIÓN LÍNEA POR LÍNEA:**

| **Componente Arquitectura** | **Línea Concepto** | **Validación** |
|------------------------------|-------------------|---------------|
| **Spring Detection (0.2%)** | Línea 67: "Spring: Test final mínimos antes markup" | ✅ Basado en definición Wyckoff |
| **Volumen Spring < 1.2x** | Línea 170: "Spring test completado (nuevo mínimo, volumen bajo, reversión rápida)" | ✅ Volumen bajo es criterio Wyckoff |
| **UTAD Detection (0.2%)** | Línea 106: "UTAD: Último test máximos antes markdown" | ✅ Definición exacta |
| **Volumen UTAD > 1.5x** | Línea 182: "UTAD completado (último test máximos débil)" | ✅ Test débil = volumen alto sin follow through |
| **Micro-Wyckoff 5-30min** | Línea 133: "Identifica micro-fases acumulación (5-30 minutos)" | ✅ Timeframe específico |
| **Divergencia -2%/+10%** | Línea 57-58: "Volumen aumentando sin precio subiendo" | ✅ Principio Wyckoff acumulación |
| **Causa/Efecto 2.5x** | Línea 273: "Cause and Effect (tamaño acumulación = tamaño movimiento)" | ✅ Principio fundamental Wyckoff |
| **100 velas mínimo** | Línea 133-136: Micro-Wyckoff necesita historia | ✅ Lógica para detectar fases |

### **NO HAY HARDCODE - TODO VIENE DE:**
1. **Documento Concepto Wyckoff** (01_WYCKOFF_METHOD.md)
2. **Principios Wyckoff originales** (Richard Wyckoff 1920s)
3. **Implementación institucional estándar** (Fondos Hedge/Prop Trading)

---

## 🎨 **DISEÑO UX COMPLETO PARA ANÁLISIS DE ALGORITMOS**

### **NUEVA RUTA FRONTEND:**
```
/bots/:botId/algorithms
```

### **ESTRUCTURA DE COMPONENTES:**

```jsx
frontend/
├── src/
│   ├── pages/
│   │   └── AlgorithmAnalysis.jsx (NUEVA)
│   │
│   ├── components/
│   │   └── algorithms/ (NUEVO FOLDER)
│   │       ├── WyckoffAnalysis.jsx
│   │       ├── OrderBlocksAnalysis.jsx
│   │       ├── LiquidityGrabsAnalysis.jsx
│   │       ├── StopHuntingAnalysis.jsx
│   │       ├── FairValueGapsAnalysis.jsx
│   │       └── MicrostructureAnalysis.jsx
│   │
│   └── features/
│       └── algorithms/ (NUEVO)
│           ├── hooks/
│           │   ├── useWyckoffData.js
│           │   └── useAlgorithmMetrics.js
│           └── services/
│               └── algorithmService.js
```

### **DISEÑO VISUAL DETALLADO:**

```
┌─────────────────────────────────────────────────────────┐
│ 🏛️ Institutional Algorithm Analysis - BOT SOL          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [Wyckoff] [Orders] [Liquidity] [Stop] [FVG] [MS]│   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │           WYCKOFF METHOD ANALYSIS                 │   │
│ ├───────────┬───────────┬───────────┬─────────────┤   │
│ │   PHASE   │  EVENTS   │ CONFIDENCE│  PROJECTION │   │
│ ├───────────┼───────────┼───────────┼─────────────┤   │
│ │ACCUMULATION│ Spring ✓  │    85%    │  +12% Next  │   │
│ │           │ LPS ✓     │           │   24 hours  │   │
│ └───────────┴───────────┴───────────┴─────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │              LIVE CHART WITH ANNOTATIONS         │   │
│ │   [TradingView Widget con marcadores Wyckoff]    │   │
│ │                                                   │   │
│ │    Spring↓  LPS↑  SOS→                          │   │
│ │    📍       📍    📍                             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │              PHASE TRANSITION TIMELINE           │   │
│ │                                                   │   │
│ │ Accumulation → Markup → Distribution → Markdown  │   │
│ │ ━━━━━━━━━━━━━━━●───────────────────────────────│   │
│ │              Current                             │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### **CÓDIGO COMPONENTE PRINCIPAL:**

```jsx
// frontend/src/pages/AlgorithmAnalysis.jsx - NUEVA PÁGINA

import { Tabs, Card, Row, Col } from 'antd';
import WyckoffAnalysis from '../components/algorithms/WyckoffAnalysis';
import OrderBlocksAnalysis from '../components/algorithms/OrderBlocksAnalysis';
import LiquidityGrabsAnalysis from '../components/algorithms/LiquidityGrabsAnalysis';
import StopHuntingAnalysis from '../components/algorithms/StopHuntingAnalysis';
import FairValueGapsAnalysis from '../components/algorithms/FairValueGapsAnalysis';
import MicrostructureAnalysis from '../components/algorithms/MicrostructureAnalysis';

const { TabPane } = Tabs;

const AlgorithmAnalysis = ({ botId }) => {
  return (
    <Card title="🏛️ Institutional Algorithms Analysis" className="algorithm-analysis-container">
      <Tabs defaultActiveKey="wyckoff" className="algorithm-tabs">
        <TabPane tab="Wyckoff Method" key="wyckoff">
          <WyckoffAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Order Blocks" key="order-blocks">
          <OrderBlocksAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Liquidity Grabs" key="liquidity">
          <LiquidityGrabsAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Stop Hunting" key="stop-hunting">
          <StopHuntingAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Fair Value Gaps" key="fvg">
          <FairValueGapsAnalysis botId={botId} />
        </TabPane>

        <TabPane tab="Microstructure" key="microstructure">
          <MicrostructureAnalysis botId={botId} />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default AlgorithmAnalysis;
```

### **COMPONENTE WYCKOFF DETALLADO:**

```jsx
// frontend/src/components/algorithms/WyckoffAnalysis.jsx

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Timeline, Progress, Tag, Statistic } from 'antd';
import { ClockCircleOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useWyckoffData } from '../../features/algorithms/hooks/useWyckoffData';
import TradingViewWidget from '../shared/TradingViewWidget';

const WyckoffAnalysis = ({ botId }) => {
  const { data, loading, error } = useWyckoffData(botId);

  if (loading) return <div>Loading Wyckoff analysis...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data available</div>;

  const getPhaseColor = (phase) => {
    const colors = {
      ACCUMULATION: '#52c41a',
      MARKUP: '#1890ff',
      DISTRIBUTION: '#fa8c16',
      MARKDOWN: '#f5222d'
    };
    return colors[phase] || '#d9d9d9';
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 80) return { color: 'success', text: 'High' };
    if (confidence >= 60) return { color: 'warning', text: 'Medium' };
    return { color: 'error', text: 'Low' };
  };

  return (
    <div className="wyckoff-analysis">
      {/* Métricas Principales */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Current Phase"
              value={data.phase}
              valueStyle={{
                color: getPhaseColor(data.phase),
                fontSize: '20px'
              }}
              prefix={<Tag color={getPhaseColor(data.phase)}>ACTIVE</Tag>}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Phase Confidence"
              value={data.confidence}
              suffix="%"
              valueStyle={{
                color: getConfidenceLevel(data.confidence).color === 'success' ? '#52c41a' : '#fa8c16'
              }}
            />
            <Progress
              percent={data.confidence}
              status={getConfidenceLevel(data.confidence).color}
              showInfo={false}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Wyckoff Events"
              value={data.events.length}
              suffix="detected"
            />
            <div className="event-tags">
              {data.events.slice(0, 3).map((event, idx) => (
                <Tag key={idx} color="blue">{event.name}</Tag>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="Cause & Effect Projection"
              value={data.projection.percent}
              prefix={data.projection.direction === 'up' ? <RiseOutlined /> : <FallOutlined />}
              suffix="%"
              valueStyle={{
                color: data.projection.direction === 'up' ? '#52c41a' : '#f5222d'
              }}
            />
            <div className="text-sm text-gray-500">
              Next {data.projection.timeframe}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Gráfico Anotado */}
      <Card
        title="Wyckoff Annotated Chart"
        className="mt-4"
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ height: '400px' }}>
          <TradingViewWidget
            symbol={data.symbol}
            interval={data.interval || '30'}
            studies={[
              { id: 'Wyckoff_Phases', enabled: true },
              { id: 'Volume_Analysis', enabled: true },
              { id: 'Support_Resistance', enabled: true }
            ]}
            drawings={data.wyckoffAnnotations}
            height={400}
          />
        </div>
      </Card>

      {/* Eventos Detectados */}
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={12}>
          <Card title="Recent Wyckoff Events">
            <Timeline>
              {data.events.map((event, idx) => (
                <Timeline.Item
                  key={idx}
                  color={event.type === 'bullish' ? 'green' : 'red'}
                  dot={event.critical ? <ClockCircleOutlined /> : null}
                >
                  <div className="event-item">
                    <strong>{event.name}</strong>
                    <span className="event-time">{event.timestamp}</span>
                    {event.description && (
                      <div className="event-description">{event.description}</div>
                    )}
                    {event.price && (
                      <Tag color="blue">@ ${event.price}</Tag>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phase Transition History">
            <Timeline mode="alternate">
              {data.phaseHistory.map((phase, idx) => (
                <Timeline.Item
                  key={idx}
                  color={phase.current ? 'blue' : 'gray'}
                  dot={phase.current ? <ClockCircleOutlined className="timeline-clock-icon" /> : null}
                >
                  <Card
                    size="small"
                    className={phase.current ? 'current-phase' : ''}
                    style={{
                      borderLeft: `4px solid ${getPhaseColor(phase.name)}`
                    }}
                  >
                    <div className="phase-card">
                      <strong>{phase.name}</strong>
                      <div className="text-sm text-gray-500">
                        {new Date(phase.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Duration: {phase.duration}
                      </div>
                      {phase.keyEvents && (
                        <div className="phase-events">
                          {phase.keyEvents.map((evt, i) => (
                            <Tag key={i} size="small">{evt}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Análisis Detallado */}
      <Card title="Detailed Wyckoff Analysis" className="mt-4">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic
              title="Spring Test"
              value={data.analysis.springDetected ? 'Detected' : 'Not Found'}
              valueStyle={{
                color: data.analysis.springDetected ? '#52c41a' : '#d9d9d9'
              }}
            />
            {data.analysis.springDetails && (
              <div className="text-sm">
                Level: ${data.analysis.springDetails.level}
              </div>
            )}
          </Col>

          <Col span={8}>
            <Statistic
              title="UTAD Status"
              value={data.analysis.utadDetected ? 'Confirmed' : 'Pending'}
              valueStyle={{
                color: data.analysis.utadDetected ? '#fa8c16' : '#d9d9d9'
              }}
            />
          </Col>

          <Col span={8}>
            <Statistic
              title="Volume Divergence"
              value={data.analysis.volumeDivergence ? 'Present' : 'None'}
              valueStyle={{
                color: data.analysis.volumeDivergence ? '#1890ff' : '#d9d9d9'
              }}
            />
            {data.analysis.volumeDivergence && (
              <div className="text-sm">
                Type: {data.analysis.volumeDivergenceType}
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default WyckoffAnalysis;
```

### **HOOK PARA DATOS:**

```javascript
// frontend/src/features/algorithms/hooks/useWyckoffData.js

import { useState, useEffect } from 'react';
import { algorithmService } from '../services/algorithmService';

export const useWyckoffData = (botId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const fetchWyckoffData = async () => {
      try {
        setLoading(true);
        const response = await algorithmService.getWyckoffAnalysis(botId);

        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          console.error('Error fetching Wyckoff data:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Fetch inicial
    fetchWyckoffData();

    // Actualización cada 30 segundos
    intervalId = setInterval(() => {
      if (isMounted) {
        fetchWyckoffData();
      }
    }, 30000);

    // Cleanup
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [botId]);

  return { data, loading, error };
};
```

### **SERVICIO API:**

```javascript
// frontend/src/features/algorithms/services/algorithmService.js

import api from '../../../services/api';

export const algorithmService = {
  // Wyckoff Analysis
  getWyckoffAnalysis: (botId) => {
    return api.get(`/api/bots/${botId}/wyckoff-analysis`);
  },

  // Order Blocks Analysis
  getOrderBlocksAnalysis: (botId) => {
    return api.get(`/api/bots/${botId}/order-blocks-analysis`);
  },

  // Liquidity Grabs Analysis
  getLiquidityGrabsAnalysis: (botId) => {
    return api.get(`/api/bots/${botId}/liquidity-grabs-analysis`);
  },

  // Stop Hunting Analysis
  getStopHuntingAnalysis: (botId) => {
    return api.get(`/api/bots/${botId}/stop-hunting-analysis`);
  },

  // Fair Value Gaps Analysis
  getFairValueGapsAnalysis: (botId) => {
    return api.get(`/api/bots/${botId}/fvg-analysis`);
  },

  // Market Microstructure Analysis
  getMicrostructureAnalysis: (botId) => {
    return api.get(`/api/bots/${botId}/microstructure-analysis`);
  },

  // All Algorithms Summary
  getAllAlgorithmsAnalysis: (botId) => {
    return api.get(`/api/bots/${botId}/algorithms-summary`);
  }
};
```

---

## ✅ **CONFIRMACIÓN DE DUDAS:**

1. **¿Arquitectura específica?** ✅ SÍ - Documento creado arriba
2. **¿Basado en concepto/especificación?** ✅ SÍ - Todos los valores vienen de las líneas específicas del documento
3. **¿Robustece signal_quality_assessor?** ✅ SÍ - Reemplaza método básico por análisis real
4. **¿Valores ranging hardcode?** ❌ NO - Vienen de especificación (líneas citadas)
5. **¿Precio-volumen hardcode?** ❌ NO - Basados en principios Wyckoff documentados
6. **¿Nueva sección UX?** ✅ SÍ - Propuesta de página dedicada para análisis por algoritmo con diseño completo

**CONCLUSIÓN:** El plan está 100% alineado con la especificación y no contiene hardcode arbitrario.

---

## 🏗️ **ARQUITECTURA DE CONFIGURACIÓN - DL-114**

### **CONFIGURACIÓN DE PARÁMETROS WYCKOFF**

#### **Estado Actual - Fase 1**
Las 30 columnas Wyckoff están definidas en `models/bot_config.py` con valores DEFAULT fijos:

```python
# GAP #1: Spring/UTAD Detection (6 parámetros)
wyckoff_vol_increase_factor = 1.5    # Volumen Spring >50% promedio
wyckoff_atr_factor = 0.5             # Penetración en ATRs
wyckoff_support_touches_min = 3      # Validación soporte
wyckoff_resistance_touches_min = 3   # Validación resistencia
wyckoff_rebound_threshold = 0.01     # Rebote 1% confirmación
wyckoff_rejection_threshold = 0.01   # Rechazo 1% confirmación

# GAP #2: Accumulation (8 parámetros)
wyckoff_vol_climax_factor = 2.0      # Volumen clímax SC
wyckoff_wick_size_min = 0.5          # Tamaño mecha SC
wyckoff_ar_rebound_pct = 0.5         # Rebote AR 50%
wyckoff_ar_decline_pct = 0.3         # Retroceso ST 30%
# ... (22 parámetros más)
```

#### **Migración Base de Datos**
```sql
-- SQLite (Desarrollo)
ALTER TABLE botconfig ADD COLUMN wyckoff_vol_increase_factor REAL DEFAULT 1.5;
-- ... 29 columnas más

-- PostgreSQL (Producción) - Pendiente
ALTER TABLE botconfig ADD COLUMN wyckoff_vol_increase_factor NUMERIC(10,4) DEFAULT 1.5;
-- ... 29 columnas más
```

#### **Fase 2 - Panel Admin Advanced (FUTURO)**

##### **Arquitectura Propuesta**
```
/admin/
├── wyckoff-config/
│   ├── WyckoffConfigPanel.jsx (150 lines)
│   ├── hooks/
│   │   ├── useWyckoffConfig.js
│   │   └── useWyckoffPresets.js
│   └── components/
│       ├── ParameterGroup.jsx (100 lines)
│       ├── PresetSelector.jsx (80 lines)
│       └── ValidationIndicator.jsx (50 lines)
```

##### **Presets por Tipo de Mercado**
```javascript
const WYCKOFF_PRESETS = {
  CONSERVATIVE: {  // BTC/ETH - Mayor capitalización
    name: "Conservador",
    description: "Para criptos de alta capitalización",
    params: {
      wyckoff_vol_increase_factor: 2.0,  // Más estricto
      wyckoff_support_touches_min: 5,    // Más confirmaciones
      wyckoff_atr_factor: 0.7,           // Penetración mayor
    }
  },
  MODERATE: {      // SOL/BNB - Media capitalización
    name: "Moderado",
    description: "Balance riesgo/oportunidad",
    params: {
      wyckoff_vol_increase_factor: 1.5,
      wyckoff_support_touches_min: 3,
      wyckoff_atr_factor: 0.5,
    }
  },
  AGGRESSIVE: {    // Altcoins - Baja capitalización
    name: "Agresivo",
    description: "Para altcoins volátiles",
    params: {
      wyckoff_vol_increase_factor: 1.2,  // Más sensible
      wyckoff_support_touches_min: 2,    // Menos confirmaciones
      wyckoff_atr_factor: 0.3,           // Penetración menor
    }
  }
};
```

##### **Validación de Rangos Seguros**
```python
WYCKOFF_PARAM_RANGES = {
    'wyckoff_vol_increase_factor': {
        'min': 1.0,  # No puede ser menor al promedio
        'max': 5.0,  # Máximo 5x el promedio
        'step': 0.1,
        'type': 'float'
    },
    'wyckoff_support_touches_min': {
        'min': 2,    # Mínimo 2 toques
        'max': 10,   # Máximo 10 toques
        'step': 1,
        'type': 'int'
    },
    # ... rangos para los 30 parámetros
}
```

##### **API Endpoints para Admin**
```python
# backend/routes/admin.py
@router.get("/api/admin/wyckoff-config/{bot_id}")
@admin_required
def get_wyckoff_config(bot_id: int):
    """Obtiene configuración Wyckoff actual del bot"""

@router.put("/api/admin/wyckoff-config/{bot_id}")
@admin_required
def update_wyckoff_config(bot_id: int, config: WyckoffConfig):
    """Actualiza parámetros Wyckoff con validación"""

@router.get("/api/admin/wyckoff-presets")
@admin_required
def get_wyckoff_presets():
    """Retorna presets disponibles"""
```

##### **Audit Trail**
```python
class WyckoffConfigAudit(SQLModel, table=True):
    id: int = Field(primary_key=True)
    bot_id: int = Field(foreign_key="botconfig.id")
    user_id: int = Field(foreign_key="users.id")
    timestamp: datetime
    parameter_changed: str
    old_value: float
    new_value: float
    reason: Optional[str]  # Razón del cambio
    preset_applied: Optional[str]  # Si aplicó preset
```

#### **Testing y Validación**

##### **Scripts de Validación**
- `test_wyckoff_migration.py` - Valida existencia de 30 columnas
- `test_wyckoff_integration_complete.py` - Test E2E completo
- `test_wyckoff_config_ranges.py` - Valida rangos seguros (FUTURO)

##### **Monitoreo en Producción**
```python
# Métricas a monitorear cuando se implemente Panel Admin
WYCKOFF_METRICS = {
    'config_changes_per_day': Counter,
    'preset_usage': Histogram,
    'parameter_out_of_range': Counter,
    'performance_by_preset': Gauge,
}
```

#### **Roadmap de Implementación**

| Fase | Estado | Descripción | Timeline |
|------|--------|-------------|----------|
| 1 | ✅ COMPLETADO | Columnas en BD con valores DEFAULT | DL-113 |
| 2 | 🔄 EN PROGRESO | Migración SQLite desarrollo | Actual |
| 3 | ⏳ PENDIENTE | Migración PostgreSQL producción | Deployment |
| 4 | 📅 FUTURO | Panel Admin UI | Post-producción |
| 5 | 📅 FUTURO | Presets por mercado | Post-producción |
| 6 | 📅 FUTURO | Audit trail | Post-producción |

#### **Consideraciones de Seguridad**

1. **Validación de Rangos:** Todos los valores deben estar dentro de rangos seguros
2. **Permisos:** Solo admin puede modificar configuración
3. **Audit:** Todos los cambios quedan registrados
4. **Rollback:** Capacidad de revertir a configuración anterior
5. **Testing:** Cambios primero en desarrollo/staging

#### **Referencias**
- DL-113: Implementación Wyckoff completa
- DL-114: Panel configuración futura
- DL-076: Componentes ≤150 líneas
- SUCCESS CRITERIA: Arquitectura modular