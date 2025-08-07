# 🤖 Especificaciones Detalladas - Creación de Bots InteliBotX

## 📋 **Basado en Comentarios Específicos del Usuario Eduard Guzmán**

### 🎯 **OBSERVACIONES IDENTIFICADAS POR EL USUARIO:**

#### 1. **Configuración de Creación de Bot**:
El usuario identificó falencias específicas en la interfaz de creación de bots que requieren atención:

##### **Campos Requeridos para Bot Configuration:**

1. **Nombre del Bot**:
   - Campo: `name` (string)
   - Ejemplos sugeridos: "Bot Fuerte Austero", "Bot Conservador Estable", "Bot Agresivo Alpha"
   - Requerimiento: Nombres personalizables y descriptivos

2. **Selección de Divisa Base**:
   - Campo: `base_currency` 
   - Opciones: USDT, BUSD, BTC, ETH
   - Funcionalidad: "con que base el entrará al mercado"
   - Requerimiento: Dropdown con balances disponibles

3. **Tipo de Mercado**:
   - Campo: `market_type`
   - Opciones: SPOT, FUTURES
   - Requerimiento: Selector radio buttons
   - Nota usuario: "Market type selection functionality" debe mantenerse

4. **Configuración de Apalancamiento**:
   - Campo: `leverage` (integer)
   - Rango: 1x (SPOT) hasta 125x (FUTURES)
   - Requerimiento: Slider dinámico basado en market_type
   - Default: 1x para SPOT, 10x para FUTURES

5. **Tipo de Margen (Solo FUTURES)**:
   - Campo: `margin_type`
   - Opciones: CROSS, ISOLATED
   - Default: ISOLATED
   - Requerimiento: Mostrar solo si market_type = FUTURES

6. **Gestión de Entrada (Entry Management)**:
   - Campo: `entry_strategy`
   - Opciones: 
     - "Market Entry" (entrada inmediata)
     - "Limit Entry" (esperar precio específico)
     - "DCA Entry" (Dollar Cost Averaging)
   - Requerimiento: Configuración específica por estrategia

7. **Gestión de Salida (Exit Management)**:
   - Campos: `take_profit_strategy`, `stop_loss_strategy`
   - **Take Profit**: 
     - Porcentual (% ganancia)
     - Fijo (precio target)
     - Trailing (seguimiento dinámico)
   - **Stop Loss**:
     - Porcentual (% pérdida máxima)
     - ATR-based (basado en volatilidad)
     - Time-based (exit por tiempo)

#### 2. **Valores Monetarios Dinámicos**:
El usuario requiere que los valores se muestren tanto en:
- **Porcentaje**: 2.5% Take Profit
- **Valor monetario**: $25.00 USDT (basado en stake amount)
- **Requerimiento**: Cálculo en tiempo real mientras el usuario modifica parámetros

#### 3. **Persistencia de Parámetros**:
El usuario identifica la necesidad de:
- **Configuraciones guardadas**: Plantillas de bot reutilizables
- **Parámetros por defecto**: Basados en estrategia seleccionada  
- **Historial de configuraciones**: Configuraciones exitosas previas

---

## 🔧 **IMPLEMENTACIÓN TÉCNICA REQUERIDA:**

### **Frontend Form Structure:**
```javascript
// BotCreationModal.jsx - Estructura requerida
const botFormFields = {
  // Básico
  name: "Bot Fuerte Austero",
  symbol: "BTCUSDT", 
  strategy: "Smart Scalper",
  
  // Configuración Mercado
  market_type: "SPOT", // SPOT | FUTURES
  base_currency: "USDT",
  leverage: 1, // 1-125x
  margin_type: "ISOLATED", // CROSS | ISOLATED
  
  // Capital y Gestión
  stake: 1000, // Amount en base_currency
  risk_percentage: 1.0, // % del balance para este bot
  
  // Entry Management
  entry_strategy: "Market Entry", // Market | Limit | DCA
  entry_price: null, // Solo si Limit Entry
  dca_levels: 3, // Solo si DCA Entry
  
  // Exit Management  
  take_profit: {
    type: "percentage", // percentage | fixed | trailing
    value: 2.5, // % o precio
    monetary_display: "$25.00 USDT" // calculado dinámicamente
  },
  
  stop_loss: {
    type: "percentage", // percentage | atr | time
    value: 1.5, // % o ATR multiple
    monetary_display: "-$15.00 USDT" // calculado dinámicamente
  }
}
```

### **Backend Model Updates Required:**
```python
# models/bot_config.py - Campos adicionales
class BotConfig(SQLModel, table=True):
    # ... campos existentes ...
    
    # Nuevos campos requeridos por usuario
    name: str = Field(description="Nombre personalizado del bot")
    base_currency: str = Field(default="USDT", description="Divisa base para trading")
    leverage: int = Field(default=1, description="Apalancamiento 1-125x")
    margin_type: str = Field(default="ISOLATED", description="CROSS o ISOLATED")
    
    # Entry Management
    entry_strategy: str = Field(default="Market Entry", description="Market/Limit/DCA")
    entry_price: Optional[float] = Field(default=None, description="Precio entrada (Limit)")
    dca_levels: Optional[int] = Field(default=None, description="Niveles DCA")
    
    # Exit Management Enhanced
    take_profit_type: str = Field(default="percentage", description="percentage/fixed/trailing")
    stop_loss_type: str = Field(default="percentage", description="percentage/atr/time")
    
    # User Ownership (ya implementado en FASE 0)
    user_id: int = Field(foreign_key="user.id", description="Propietario del bot")
```

---

## 🎯 **CASOS DE USO ESPECÍFICOS:**

### **Caso 1: "Bot Fuerte Austero" - SPOT Trading:**
```json
{
  "name": "Bot Fuerte Austero",
  "symbol": "BTCUSDT",
  "market_type": "SPOT",
  "base_currency": "USDT", 
  "leverage": 1,
  "stake": 1000,
  "strategy": "Smart Scalper",
  "entry_strategy": "Market Entry",
  "take_profit": {"type": "percentage", "value": 1.8},
  "stop_loss": {"type": "percentage", "value": 0.9},
  "risk_percentage": 0.8
}
```

### **Caso 2: "Bot Agresivo Alpha" - FUTURES Trading:**
```json
{
  "name": "Bot Agresivo Alpha", 
  "symbol": "ETHUSDT",
  "market_type": "FUTURES",
  "base_currency": "USDT",
  "leverage": 20,
  "margin_type": "ISOLATED",
  "stake": 500,
  "strategy": "Trend Hunter", 
  "entry_strategy": "DCA Entry",
  "dca_levels": 4,
  "take_profit": {"type": "trailing", "value": 3.5},
  "stop_loss": {"type": "atr", "value": 2.0},
  "risk_percentage": 2.5
}
```

### **Caso 3: "Bot Conservador Estable" - Mixed Strategy:**
```json
{
  "name": "Bot Conservador Estable",
  "symbol": "ADAUSDT", 
  "market_type": "SPOT",
  "base_currency": "USDT",
  "stake": 2000,
  "strategy": "Volatility Master",
  "entry_strategy": "Limit Entry",
  "entry_price": 0.45,
  "take_profit": {"type": "fixed", "value": 0.49},
  "stop_loss": {"type": "percentage", "value": 1.2},
  "risk_percentage": 1.0
}
```

---

## 🔒 **CONSIDERACIONES DE SEGURIDAD:**

### **API Keys Management (Según preocupación del usuario):**

El usuario expresó específicamente: *"el tema es que ya en los .env estan las API tanto de test como reales y eso es un riesgo por eso me pregunto si ya deberíamos al menos tambén cubrir esos aspectos."*

**✅ SOLUCIÓN IMPLEMENTADA EN FASE 0:**
- **AES-256 Encryption**: API keys completamente encriptadas
- **User-specific credentials**: Cada usuario tiene sus propias keys
- **No .env exposure**: Credenciales nunca expuestas en código
- **JWT Authentication**: Acceso seguro por usuario

**🔐 IMPLEMENTACIÓN EN FRONTEND (FASE 1):**
```javascript
// components/ApiKeysManager.jsx
const ApiKeysManager = () => {
  return (
    <div className="api-keys-manager">
      <h3>🔐 Configuración API Keys Binance</h3>
      
      <div className="security-warning">
        ⚠️ Tus API keys son encriptadas con AES-256 y nunca se exponen
      </div>
      
      <form onSubmit={handleUpdateKeys}>
        <input 
          type="password" 
          placeholder="Binance API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <input 
          type="password"
          placeholder="Binance API Secret" 
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
        />
        
        <button type="button" onClick={testConnection}>
          🧪 Test Connection
        </button>
        
        <button type="submit">
          🔒 Save Encrypted Keys
        </button>
      </form>
      
      {connectionStatus && (
        <div className="connection-status">
          {connectionStatus.success ? "✅ Conexión exitosa" : "❌ Error conexión"}
          {connectionStatus.balance && (
            <div>Balance: {connectionStatus.balance} USDT</div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 📊 **MÉTRICAS Y VALIDACIONES:**

### **Validaciones en Tiempo Real:**
1. **Balance suficiente**: Verificar que stake <= balance disponible
2. **Leverage válido**: Según market_type y exchange limits
3. **Risk management**: Total risk % todos los bots <= límite usuario
4. **API connection**: Verificar credenciales antes de crear bot

### **Cálculos Dinámicos:**
```javascript
// Cálculos monetarios en tiempo real
const calculateMonetaryValues = (stake, takeProfit, stopLoss) => {
  const tpAmount = (stake * takeProfit) / 100;
  const slAmount = (stake * stopLoss) / 100;
  
  return {
    takeProfitMoney: `$${tpAmount.toFixed(2)} USDT`,
    stopLossMoney: `-$${slAmount.toFixed(2)} USDT`,
    riskReward: (takeProfit / stopLoss).toFixed(2)
  };
};
```

---

## 🎯 **PRÓXIMOS PASOS IMPLEMENTACIÓN:**

### **FASE 1 - Frontend Auth (Días 9-11):**
1. **LoginPage + RegisterPage** - Sistema authentication
2. **AuthContext + Protected Routes** - Access control
3. **User-specific bot creation** - Ownership implementation
4. **API Keys Manager** - Personal credentials interface

### **FASE 1B - Bot Creation Enhanced (Días 12-13):**
1. **Enhanced BotCreationModal** - Todos los campos especificados
2. **Monetary calculations** - Valores dinámicos tiempo real
3. **Market type handling** - SPOT vs FUTURES configuration
4. **Entry/Exit strategies** - Management avanzado

### **FASE 1C - Integration + Testing (Día 14):**
1. **Real Binance integration** - Datos live en bot creation
2. **Balance validation** - Verificación fondos disponibles
3. **Bot templates** - Configuraciones predefinidas
4. **E2E testing** - Flow completo usuario

---

## 🏆 **RESULTADO ESPERADO:**

**Sistema completo que permita:**
- ✅ **Login seguro** con credenciales personales
- ✅ **Bot creation avanzada** con todas las especificaciones usuario
- ✅ **Valores monetarios dinámicos** calculados en tiempo real
- ✅ **Configuraciones persistentes** y reutilizables  
- ✅ **API keys seguras** sin exposición .env
- ✅ **Trading real** con datos live de Binance testnet
- ✅ **Multi-user support** con ownership por usuario

---

> **Documento basado en**: Comentarios específicos usuario Eduard Guzmán sobre falencias identificadas en creación de bots + preocupaciones seguridad API keys + especificaciones detalladas configuración bot avanzada.

📅 **Fecha**: 08 Agosto 2025  
👨‍💻 **Para**: Eduard Guzmán - InteliBotX  
🎯 **Objetivo**: Guía implementación bot creation según requirements específicos usuario