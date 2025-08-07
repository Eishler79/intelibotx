# 🔗 Especificaciones Técnicas - Sistema Gestión de Exchanges

## 📋 **Basado en UI/UX de 3Commas - Screenshots Usuario**

### 🎯 **REFERENCIA VISUAL - Imágenes Proporcionadas:**

#### **Imagen #2**: Parámetros de Usuario
- **Elemento clave**: Opción "Añadir exchange" en settings usuario
- **Ubicación**: En menú lateral/configuración usuario  
- **Funcionalidad**: Entry point para gestionar exchanges

#### **Imagen #3**: Selección de Exchange 
- **Grid de exchanges**: Binance, Bybit, OKX, KuCoin, Binance TR, Binance US, Bitfinex, Bitget, Bitstamp, Coinbase Advanced, Coinbase Perpetual, Gate.io, Gemini, HTX, Kraken
- **Tabs superiores**: Spot, Margin, Futures
- **Título**: "Conectar un exchange"
- **Subtítulo**: "Libera tus bots en más mercados conectando intercambios adicionales"
- **Button**: "Conectar un exchange"

#### **Imagen #4**: Formulario Conexión Binance
- **Título**: "Connect Binance"
- **Tabs**: "Conexión Rápida" | "API Keys" 
- **Campos**:
  - Nombre: "Mi Binance" (personalizable)
  - Clave API: (input field)
  - API Secreta: (input field)
- **IP Whitelist**: Lista de IPs con copy button
- **Botón**: "Conectar" (color accent)
- **Expandable**: "Especifique los tipos de cuenta requeridos al generar claves de API"

---

## 🏗️ **ARQUITECTURA TÉCNICA REQUERIDA:**

### **Backend Models:**

```python
# models/user_exchange.py
class UserExchange(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Exchange Info
    exchange_name: str = Field(..., description="binance, bybit, okx, etc.")
    exchange_display_name: str = Field(..., description="Mi Binance, Trading Principal")
    exchange_type: str = Field(..., description="spot, margin, futures")
    
    # Encrypted Credentials
    encrypted_api_key: str = Field(..., description="AES-256 encrypted API key")
    encrypted_api_secret: str = Field(..., description="AES-256 encrypted API secret") 
    encrypted_passphrase: Optional[str] = Field(default=None, description="Para exchanges que lo requieren")
    
    # Connection Status
    is_active: bool = Field(default=True, description="Exchange enabled/disabled")
    connection_status: str = Field(default="pending", description="pending, connected, error")
    last_test_date: Optional[datetime] = Field(default=None)
    last_error_message: Optional[str] = Field(default=None)
    
    # Permissions & Features
    has_spot_permission: bool = Field(default=False)
    has_futures_permission: bool = Field(default=False)
    has_margin_permission: bool = Field(default=False)
    can_trade: bool = Field(default=False)
    can_withdraw: bool = Field(default=False)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# models/exchange_balance.py  
class ExchangeBalance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_exchange_id: int = Field(foreign_key="userexchange.id")
    
    asset: str = Field(..., description="BTC, ETH, USDT, etc.")
    free_balance: float = Field(default=0.0)
    locked_balance: float = Field(default=0.0) 
    total_balance: float = Field(default=0.0)
    usd_value: Optional[float] = Field(default=None, description="Valor en USD estimado")
    
    last_updated: datetime = Field(default_factory=datetime.utcnow)
```

### **Backend Services:**

```python
# services/exchange_factory.py
class ExchangeFactory:
    @staticmethod
    def create_exchange_client(user_exchange: UserExchange, encryption_service: EncryptionService):
        """Factory method para crear clientes específicos por exchange"""
        
        # Decrypt credentials
        api_key = encryption_service.decrypt_api_key(user_exchange.encrypted_api_key)
        api_secret = encryption_service.decrypt_api_key(user_exchange.encrypted_api_secret)
        
        if user_exchange.exchange_name == "binance":
            return BinanceClient(api_key, api_secret, testnet=True)
        elif user_exchange.exchange_name == "bybit":
            return BybitClient(api_key, api_secret, testnet=True)
        elif user_exchange.exchange_name == "okx":
            return OKXClient(api_key, api_secret, user_exchange.encrypted_passphrase)
        # ... más exchanges
        
        raise ValueError(f"Exchange {user_exchange.exchange_name} not supported")

# services/exchange_validation_service.py
class ExchangeValidationService:
    def __init__(self, exchange_factory: ExchangeFactory):
        self.exchange_factory = exchange_factory
        
    async def test_connection(self, user_exchange: UserExchange) -> Dict[str, Any]:
        """Test connection to exchange and return status + info"""
        try:
            client = self.exchange_factory.create_exchange_client(user_exchange)
            
            # Test basic connection
            account_info = await client.get_account_info()
            
            # Test permissions
            permissions = await self.check_permissions(client)
            
            # Get balances
            balances = await client.get_balances()
            
            return {
                "status": "connected",
                "account_info": account_info,
                "permissions": permissions,
                "balances": balances,
                "error": None
            }
            
        except Exception as e:
            return {
                "status": "error", 
                "error": str(e),
                "account_info": None,
                "permissions": None,
                "balances": None
            }
```

### **Backend Routes:**

```python
# routes/exchanges.py
@router.get("/api/user/exchanges", response_model=List[UserExchangeResponse])
async def get_user_exchanges(current_user: User = Depends(get_current_user)):
    """Get all exchanges for authenticated user"""
    
@router.post("/api/user/exchanges", response_model=UserExchangeResponse) 
async def add_exchange(
    exchange_data: CreateExchangeRequest,
    current_user: User = Depends(get_current_user)
):
    """Add new exchange for user"""
    
@router.put("/api/user/exchanges/{exchange_id}")
async def update_exchange(
    exchange_id: int,
    exchange_data: UpdateExchangeRequest, 
    current_user: User = Depends(get_current_user)
):
    """Update exchange configuration"""
    
@router.delete("/api/user/exchanges/{exchange_id}")
async def delete_exchange(
    exchange_id: int,
    current_user: User = Depends(get_current_user) 
):
    """Delete exchange"""
    
@router.post("/api/user/exchanges/{exchange_id}/test")
async def test_exchange_connection(
    exchange_id: int,
    current_user: User = Depends(get_current_user)
):
    """Test exchange connection and update status"""
    
@router.get("/api/user/exchanges/{exchange_id}/balances")
async def get_exchange_balances(
    exchange_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get balances for specific exchange"""
```

---

## 🎨 **FRONTEND COMPONENTS:**

### **1. Exchange Management Page:**

```jsx
// pages/ExchangeManagement.jsx
const ExchangeManagement = () => {
  const [exchanges, setExchanges] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  return (
    <div className="exchange-management">
      <div className="header">
        <h2>🔗 Mis Exchanges</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          ➕ Añadir exchange
        </button>
      </div>
      
      <div className="exchanges-grid">
        {exchanges.map(exchange => (
          <ExchangeCard 
            key={exchange.id}
            exchange={exchange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTest={handleTest}
          />
        ))}
      </div>
      
      {showAddModal && (
        <AddExchangeModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={handleExchangeAdded}
        />
      )}
    </div>
  );
};
```

### **2. Add Exchange Modal (Según imagen #3):**

```jsx
// components/AddExchangeModal.jsx
const AddExchangeModal = ({ onClose, onSuccess }) => {
  const [selectedMarketType, setSelectedMarketType] = useState("Spot");
  const [selectedExchange, setSelectedExchange] = useState(null);
  
  const exchanges = [
    { name: "binance", display: "Binance", logo: "/logos/binance.svg" },
    { name: "bybit", display: "Bybit", logo: "/logos/bybit.svg" },
    { name: "okx", display: "OKX", logo: "/logos/okx.svg" },
    { name: "kucoin", display: "KuCoin", logo: "/logos/kucoin.svg" },
    { name: "binance_tr", display: "Binance TR", logo: "/logos/binance_tr.svg" },
    { name: "binance_us", display: "Binance US", logo: "/logos/binance_us.svg" },
    // ... más exchanges según imagen #3
  ];
  
  return (
    <Modal onClose={onClose} className="add-exchange-modal">
      <div className="modal-header">
        <h2>Conectar un exchange</h2>
        <p>Libera tus bots en más mercados conectando intercambios adicionales</p>
      </div>
      
      {/* Tabs según imagen #3 */}
      <div className="market-type-tabs">
        {["Spot", "Margin", "Futures"].map(type => (
          <button
            key={type}
            className={`tab ${selectedMarketType === type ? 'active' : ''}`}
            onClick={() => setSelectedMarketType(type)}
          >
            {type}
          </button>
        ))}
      </div>
      
      {/* Exchange Grid según imagen #3 */}
      <div className="exchanges-grid">
        {exchanges.map(exchange => (
          <div 
            key={exchange.name}
            className={`exchange-card ${selectedExchange?.name === exchange.name ? 'selected' : ''}`}
            onClick={() => setSelectedExchange(exchange)}
          >
            <img src={exchange.logo} alt={exchange.display} />
            <span>{exchange.display}</span>
          </div>
        ))}
      </div>
      
      <button 
        className="btn-connect"
        disabled={!selectedExchange}
        onClick={() => {
          // Proceed to connection form
          handleProceedToConnection();
        }}
      >
        Conectar un exchange
      </button>
    </Modal>
  );
};
```

### **3. Exchange Connection Form (Según imagen #4):**

```jsx
// components/ExchangeConnectionForm.jsx
const ExchangeConnectionForm = ({ exchange, marketType, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("api-keys"); // "quick" | "api-keys"
  const [formData, setFormData] = useState({
    displayName: `Mi ${exchange.display}`,
    apiKey: "",
    apiSecret: "",
    passphrase: "" // Para OKX
  });
  
  const ipWhitelist = [
    "103.26.9.5", "103.26.9.13", "103.26.9.21", 
    "103.26.9.29", "103.26.9.37", "103.26.9.4"
  ];
  
  return (
    <Modal className="exchange-connection-form">
      <div className="modal-header">
        <button onClick={goBack}>←</button>
        <h2>Connect {exchange.display}</h2>
        <button onClick={onClose}>✕</button>
      </div>
      
      {/* Security Notice */}
      <div className="security-notice">
        <span className="icon">⚪</span>
        3Commas no tendrá acceso para transferir o retirar sus activos. 
        Cada intercambio se conecta con claves API encriptadas
      </div>
      
      {/* Tabs según imagen #4 */}
      <div className="connection-tabs">
        <button 
          className={activeTab === "quick" ? "active" : ""}
          onClick={() => setActiveTab("quick")}
        >
          Conexión Rápida
        </button>
        <button 
          className={activeTab === "api-keys" ? "active" : ""}
          onClick={() => setActiveTab("api-keys")}
        >
          API Keys
        </button>
      </div>
      
      {activeTab === "api-keys" && (
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Conecta las claves de forma segura</h3>
            <a href="#" className="help-link">Guía completa ↗</a>
          </div>
          
          <div className="setup-steps">
            <p>1. Inicia sesión en tu cuenta de intercambio y ve a Configuración de la API ↗</p>
            <p>2. Activa la lista blanca de IP y copia/pega la siguiente lista de direcciones IP:</p>
            
            <div className="ip-whitelist">
              <span className="ip-list">
                {ipWhitelist.join(",")}...
              </span>
              <button type="button" onClick={copyIpList}>📋</button>
            </div>
            
            <p>3. Pega los datos generados en los campos de abajo.</p>
          </div>
          
          <div className="form-fields">
            <div className="field">
              <label>Nombre:</label>
              <input 
                type="text"
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
                placeholder="Mi Binance"
              />
            </div>
            
            <div className="field">
              <label>Clave API:</label>
              <input 
                type="password"
                value={formData.apiKey}
                onChange={e => setFormData({...formData, apiKey: e.target.value})}
                placeholder="Ingresa tu API Key"
              />
            </div>
            
            <div className="field">
              <label>API Secreta:</label>
              <input 
                type="password"
                value={formData.apiSecret}
                onChange={e => setFormData({...formData, apiSecret: e.target.value})}
                placeholder="Ingresa tu API Secret"
              />
            </div>
            
            {exchange.name === "okx" && (
              <div className="field">
                <label>Passphrase:</label>
                <input 
                  type="password"
                  value={formData.passphrase}
                  onChange={e => setFormData({...formData, passphrase: e.target.value})}
                  placeholder="Ingresa tu Passphrase"
                />
              </div>
            )}
          </div>
          
          {/* Expandable Section */}
          <details className="account-types">
            <summary>Especifique los tipos de cuenta requeridos al generar claves de API</summary>
            <div className="account-types-content">
              <p>Para {exchange.display}, asegúrate de habilitar los siguientes permisos:</p>
              <ul>
                <li>✅ Spot Trading (si seleccionaste Spot)</li>
                <li>✅ Futures Trading (si seleccionaste Futures)</li>
                <li>✅ Margin Trading (si seleccionaste Margin)</li>
                <li>❌ Withdraw (No requerido)</li>
              </ul>
            </div>
          </details>
          
          <button type="submit" className="btn-connect">
            Conectar
          </button>
        </form>
      )}
    </Modal>
  );
};
```

---

## 🔗 **INTEGRACIÓN CON SISTEMA EXISTENTE:**

### **1. Modificaciones Bot Creation:**

```jsx
// En el modal de creación de bot, agregar selector de exchange
const BotCreationModal = () => {
  const [selectedExchange, setSelectedExchange] = useState(null);
  const { userExchanges } = useAuth();
  
  return (
    <Modal>
      {/* Exchange Selector */}
      <div className="exchange-selector">
        <label>Exchange:</label>
        <select 
          value={selectedExchange?.id || ""}
          onChange={e => {
            const exchange = userExchanges.find(ex => ex.id === parseInt(e.target.value));
            setSelectedExchange(exchange);
          }}
        >
          <option value="">Selecciona un exchange</option>
          {userExchanges.map(exchange => (
            <option key={exchange.id} value={exchange.id}>
              {exchange.exchange_display_name} ({exchange.exchange_name.toUpperCase()})
            </option>
          ))}
        </select>
      </div>
      
      {/* Mostrar balance disponible del exchange seleccionado */}
      {selectedExchange && (
        <ExchangeBalanceInfo exchange={selectedExchange} />
      )}
      
      {/* ... resto del formulario bot creation */}
    </Modal>
  );
};
```

### **2. Dashboard Multi-Exchange:**

```jsx
// BotsAdvanced.jsx modificado para soporte multi-exchange
const BotsAdvanced = () => {
  const [activeExchange, setActiveExchange] = useState(null);
  const { userExchanges } = useAuth();
  
  return (
    <div className="bots-advanced">
      {/* Exchange Tabs */}
      <div className="exchange-tabs">
        {userExchanges.map(exchange => (
          <button
            key={exchange.id}
            className={`exchange-tab ${activeExchange?.id === exchange.id ? 'active' : ''}`}
            onClick={() => setActiveExchange(exchange)}
          >
            <img src={`/logos/${exchange.exchange_name}.svg`} alt={exchange.exchange_name} />
            {exchange.exchange_display_name}
            <span className="status-indicator" data-status={exchange.connection_status} />
          </button>
        ))}
      </div>
      
      {/* Bots del exchange activo */}
      {activeExchange && (
        <ExchangeBotsView exchange={activeExchange} />
      )}
    </div>
  );
};
```

---

## 🎯 **CASOS DE USO COMPLETOS:**

### **Caso 1: Usuario Nuevo - Setup Inicial**
1. **Login** con Google/Email → AuthPage
2. **No exchanges configurados** → Redirect a ExchangeManagement  
3. **Click "Añadir exchange"** → AddExchangeModal
4. **Selecciona Binance + Spot** → ExchangeConnectionForm
5. **Configura API keys** → Test connection → Success
6. **Redirect a BotsAdvanced** con Binance disponible

### **Caso 2: Usuario Avanzado - Multi-Exchange**
1. **Login** → BotsAdvanced (exchanges existentes)
2. **Tab "Mi Binance"** activo → Ve bots Binance
3. **Switch a "Trading Bybit"** → Ve bots Bybit
4. **"Añadir exchange"** → Configura KuCoin adicional
5. **Crear bot** → Selector incluye 3 exchanges
6. **Dashboard agregado** → Balances totales + por exchange

### **Caso 3: Gestión y Mantenimiento**
1. **Exchange con error** → Status indicator rojo
2. **Click exchange** → Ver detalles error
3. **"Test connection"** → Refresh status
4. **"Editar"** → Actualizar API keys
5. **"Eliminar"** → Confirmar + cleanup bots

---

## ✅ **CRITERIOS DE ACEPTACIÓN:**

### **UI/UX:**
- ✅ Diseño idéntico a screenshots 3Commas proporcionados
- ✅ Grid exchanges con logos y nombres correctos
- ✅ Tabs Spot/Margin/Futures funcionando
- ✅ Formulario conexión con todos los campos
- ✅ IP whitelist copiable
- ✅ Status indicators visuales

### **Funcionalidad:**
- ✅ CRUD completo exchanges (Add, Edit, Delete, List)
- ✅ Test connection con validation real
- ✅ Encriptación AES-256 credenciales
- ✅ Multi-exchange support simultáneo
- ✅ Balance aggregation por exchange
- ✅ Bot creation con exchange selector
- ✅ Dashboard tabs por exchange

### **Seguridad:**
- ✅ API keys nunca almacenadas en plain text
- ✅ Encryption/decryption transparente
- ✅ Validation permissions por exchange
- ✅ Error handling secure (sin exponer keys)
- ✅ Session management por exchange

### **Integración:**
- ✅ Backend compatible con FASE 0 auth system
- ✅ Frontend integrado con AuthContext
- ✅ Bot creation enhancement compatible
- ✅ Ready para FASE 1B implementation

---

> **Documento basado en**: Screenshots específicos usuario mostrando sistema 3Commas para gestión exchanges + requirements técnicos para implementación completa sistema multi-exchange en InteliBotX.

📅 **Fecha**: 08 Agosto 2025  
👨‍💻 **Para**: Eduard Guzmán - InteliBotX  
🎯 **Objetivo**: Especificaciones técnicas completas sistema gestión exchanges tipo 3Commas