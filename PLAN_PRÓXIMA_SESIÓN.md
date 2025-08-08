# 🚀 PLAN DETALLADO PRÓXIMA SESIÓN - 09 AGOSTO 2025

## ⚡ **OBJETIVO PRINCIPAL**
Completar la integración de datos reales del exchange del usuario en las operaciones de bots.

## 🎯 **TIEMPO ESTIMADO TOTAL: 2-3 horas**

---

## 📋 **PASO 1: Backend Integration (45 min)**

### **Archivo**: `/backend/routes/bots.py`
### **Endpoint**: `/api/run-smart-trade/{symbol}` (líneas 27-114)

#### **Modificaciones Específicas:**

```python
# LÍNEA 29: Agregar dependency de autenticación
@router.post("/api/run-smart-trade/{symbol}")
def run_smart_trade(
    symbol: str,
    current_user: User = Depends(get_current_user)  # ← AGREGAR ESTA LÍNEA
):

# LÍNEAS 44-57: Reemplazar lógica de obtener bot config
# CAMBIAR DE:
with Session(engine) as session:
    query = select(BotConfig).where(BotConfig.symbol == normalized_symbol)
    result = session.exec(query).first()

# CAMBIAR A:
with Session(engine) as session:
    # Obtener bot del usuario autenticado
    query = select(BotConfig).where(
        BotConfig.symbol == normalized_symbol,
        BotConfig.user_id == current_user.id
    )
    result = session.exec(query).first()
    
    if not result:
        raise HTTPException(404, "No hay bot configurado para este símbolo")
    
    # Obtener exchange del usuario si el bot no tiene exchange_id
    if not result.exchange_id:
        exchange_query = select(UserExchange).where(
            UserExchange.user_id == current_user.id
        ).first()
        if not exchange_query:
            raise HTTPException(400, "Usuario no tiene exchanges configurados")
    else:
        exchange_query = select(UserExchange).where(
            UserExchange.id == result.exchange_id
        ).first()
    
    # Desencriptar API keys y crear connector
    from services.encryption_service import EncryptionService
    encryption_service = EncryptionService()
    
    api_key = encryption_service.decrypt_api_key(exchange_query.encrypted_api_key)
    api_secret = encryption_service.decrypt_api_key(exchange_query.encrypted_api_secret)
    
    # Crear exchange connector
    exchange_factory = ExchangeFactory()
    connector = exchange_factory.create_connector(
        exchange_query.exchange_name,
        api_key,
        api_secret,
        exchange_query.is_testnet
    )
    
    # Obtener datos reales del mercado
    try:
        # Obtener precio actual
        ticker = connector.get_ticker_price(normalized_symbol)
        
        # Obtener datos de klines para análisis
        klines = connector.get_klines(normalized_symbol, result.interval, limit=100)
        
        # Crear DataFrame para análisis
        df = pd.DataFrame(klines, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        
        # Ejecutar evaluación real de estrategia
        evaluator = StrategyEvaluator(df)
        signals = evaluator.evaluate()
        
        # Agregar precio actual a las señales
        signals['current_price'] = ticker['price']
        signals['exchange'] = exchange_query.exchange_name
        
    except Exception as e:
        # Fallback en caso de error con exchange
        signals = {
            "signal": "ERROR",
            "confidence": 0.0,
            "reason": f"Error conectando con exchange: {str(e)}",
            "exchange": exchange_query.exchange_name
        }
```

---

## 📋 **PASO 2: Frontend Bot Creation (30 min)**

### **Archivo**: `/frontend/src/pages/BotsAdvanced.jsx`

#### **Modificaciones en Modal Create Bot:**

```jsx
// 1. Agregar estado para exchanges del usuario
const [userExchanges, setUserExchanges] = useState([]);

// 2. Cargar exchanges cuando se abre el modal
useEffect(() => {
  if (showCreateModal) {
    loadUserExchanges();
  }
}, [showCreateModal]);

const loadUserExchanges = async () => {
  try {
    const response = await authenticatedFetch('/api/user/exchanges');
    if (response.ok) {
      const exchanges = await response.json();
      setUserExchanges(exchanges);
    }
  } catch (error) {
    console.error('Error loading exchanges:', error);
  }
};

// 3. Agregar selector de exchange en el modal (después del campo símbolo)
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Exchange
  </label>
  <select
    value={newBot.exchange_id || ''}
    onChange={(e) => setNewBot({
      ...newBot,
      exchange_id: e.target.value ? parseInt(e.target.value) : null
    })}
    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
    required
  >
    <option value="">Seleccionar Exchange</option>
    {userExchanges.map(exchange => (
      <option key={exchange.id} value={exchange.id}>
        {exchange.connection_name} ({exchange.exchange_name.toUpperCase()})
      </option>
    ))}
  </select>
  {userExchanges.length === 0 && (
    <p className="text-yellow-400 text-sm mt-1">
      No tienes exchanges configurados. 
      <button 
        onClick={() => {/* Abrir modal exchange */}}
        className="text-blue-400 underline ml-1"
      >
        Agregar exchange
      </button>
    </p>
  )}
</div>

// 4. Incluir exchange_id en el payload de creación
const handleCreateBot = async () => {
  // Validar que se haya seleccionado exchange
  if (!newBot.exchange_id && userExchanges.length > 0) {
    setError('Por favor selecciona un exchange');
    return;
  }
  
  const botData = {
    ...newBot,
    exchange_id: newBot.exchange_id // ← Incluir en payload
  };
  
  // ... resto del código de creación
};
```

---

## 📋 **PASO 3: Testing E2E (45 min)**

### **Secuencia de Testing:**

1. **Backend Local** (15 min):
   ```bash
   cd /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend
   uvicorn main:app --reload --host=0.0.0.0 --port=8000
   ```

2. **Frontend Local** (15 min):
   ```bash
   cd /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend  
   npm run dev
   ```

3. **E2E Testing** (15 min):
   - Login: admin@intelibotx.com / admin123
   - Ir a Exchange Management
   - Agregar Binance testnet (si no existe)
   - Ir a Bots Advanced
   - Crear nuevo bot seleccionando exchange
   - Ejecutar Smart Trade
   - Verificar respuesta con datos reales

---

## 📋 **CHECKLIST VERIFICACIÓN**

### **✅ Prerequisitos (Ya completados):**
- [x] BotConfig.exchange_id field exists
- [x] UserExchange model with encryption
- [x] Exchange Management UI functional
- [x] Import statements updated

### **🎯 Por Completar:**
- [ ] Backend: Dependency authentication en smart-trade
- [ ] Backend: Logic para obtener exchange del usuario
- [ ] Backend: Reemplazar CSV data con exchange real
- [ ] Frontend: Exchange selector en bot creation
- [ ] Frontend: Validación exchanges configurados
- [ ] Testing: E2E completo con datos reales

### **✅ Criterios de Éxito:**
- [ ] Smart Trade obtiene precio real del exchange
- [ ] Bot creation requiere seleccionar exchange
- [ ] Error handling si no hay exchanges configurados
- [ ] Response incluye datos del exchange real

---

## 🚨 **NOTAS IMPORTANTES**

### **Files a Modificar:**
1. `/backend/routes/bots.py` - Smart trade endpoint
2. `/frontend/src/pages/BotsAdvanced.jsx` - Modal creation
3. Possible: `/backend/routes/bots.py` - Create bot endpoint

### **Dependencies Necesarias:**
- Ya importadas: UserExchange, ExchangeFactory, EncryptionService
- JWT authentication dependency: get_current_user

### **Error Handling:**
- Usuario sin exchanges configurados
- Exchange connection failures  
- API key validation errors
- Symbol not available en exchange

---

> **Creado**: 08-Agosto-2025 23:58h  
> **Para**: Sesión 09-Agosto-2025  
> **Estimado**: 2-3 horas total  
> **Objetivo**: Bots operando con datos reales del exchange usuario