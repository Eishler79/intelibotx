// Test de integración Frontend -> Backend
// Simula las llamadas que hace BotsModular.jsx

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0IiwiZW1haWwiOiJlZHVhcmQuZWlzaGxlckBpY2xvdWQuY29tIiwiZXhwIjoxNzU5MjQxMDI1LCJpYXQiOjE3NTkxNTQ2MjUsInR5cGUiOiJhY2Nlc3MifQ.0RRbwc-rPTtI7X-ZerfJDU8R-V5EAdpQkYoaVQB-afQ';

// Simula authenticatedFetch que usan los hooks
async function authenticatedFetch(url, options = {}) {
  const response = await fetch(`http://localhost:8000${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Simula useBotCrud.fetchBots()
async function testFetchBots() {
  console.log('\n1. Testing fetchBots() - GET /api/bots');
  try {
    const data = await authenticatedFetch('/api/bots');
    console.log('✅ fetchBots SUCCESS:', data.length, 'bots loaded');
    return data;
  } catch (error) {
    console.log('❌ fetchBots FAILED:', error.message);
    return null;
  }
}

// Simula useBotCrud.updateBot()
async function testUpdateBot(botId, updates) {
  console.log(`\n2. Testing updateBot(${botId}) - PUT /api/bots/${botId}`);
  try {
    const data = await authenticatedFetch(`/api/bots/${botId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    console.log('✅ updateBot SUCCESS:', data.message);
    return data;
  } catch (error) {
    console.log('❌ updateBot FAILED:', error.message);
    return null;
  }
}

// Simula useBotStatus.toggleBotStatus()
async function testToggleBotStatus(botId, currentStatus) {
  const newStatus = currentStatus === 'RUNNING' ? 'pause' : 'start';
  console.log(`\n3. Testing toggleBotStatus(${botId}) - POST /api/bots/${botId}/${newStatus}`);
  try {
    const data = await authenticatedFetch(`/api/bots/${botId}/${newStatus}`, {
      method: 'POST'
    });
    console.log('✅ toggleBotStatus SUCCESS:', data.message, '- New status:', data.status);
    return data;
  } catch (error) {
    console.log('❌ toggleBotStatus FAILED:', error.message);
    return null;
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('=== TESTING FRONTEND-BACKEND INTEGRATION ===');
  console.log('Simulating BotsModular.jsx API calls...\n');

  // 1. Fetch bots (lo que hace useEffect al cargar)
  const bots = await testFetchBots();

  if (bots && bots.length > 0) {
    const bot = bots[0];
    console.log(`\nBot encontrado: ${bot.name} (ID: ${bot.id}, Status: ${bot.status})`);

    // 2. Update bot (lo que hace onUpdateBot en BotControlPanel)
    await testUpdateBot(bot.id, {
      stake: 200,
      take_profit: 2.0
    });

    // 3. Toggle status (lo que hace onToggleBotStatus)
    await testToggleBotStatus(bot.id, bot.status);
  }

  console.log('\n=== TEST COMPLETED ===');
  console.log('Si todos muestran ✅, la integración funciona correctamente');
}

runTests().catch(console.error);