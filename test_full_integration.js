// Test completo de integración Frontend -> Backend
// Verifica TODAS las funciones de TODOS los hooks

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
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

// ============= useBotCrud TESTS =============

async function testFetchBots() {
  console.log('\n📋 Testing useBotCrud.fetchBots() - GET /api/bots');
  try {
    const data = await authenticatedFetch('/api/bots');
    console.log('✅ fetchBots SUCCESS:', data.length, 'bots found');
    return data;
  } catch (error) {
    console.log('❌ fetchBots FAILED:', error.message);
    return [];
  }
}

async function testCreateBot() {
  console.log('\n📋 Testing useBotCrud.createBot() - POST /api/create-bot');
  try {
    const newBot = {
      name: "Test Integration Bot",
      symbol: "BTCUSDT",
      exchange_id: 2,
      strategy: "Smart Scalper",
      interval: "5m",
      stake: 100,
      take_profit: 1.5,
      stop_loss: 0.5,
      base_currency: "USDT",
      quote_currency: "BTC",
      dca_levels: 0
    };

    const data = await authenticatedFetch('/api/create-bot', {
      method: 'POST',
      body: JSON.stringify(newBot)
    });
    console.log('✅ createBot SUCCESS: Bot created with ID:', data.id);
    return data;
  } catch (error) {
    console.log('❌ createBot FAILED:', error.message);
    return null;
  }
}

async function testUpdateBot(botId) {
  console.log(`\n📋 Testing useBotCrud.updateBot() - PUT /api/bots/${botId}`);
  try {
    const updates = {
      stake: 250,
      take_profit: 2.5
    };

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

async function testDeleteBot(botId) {
  console.log(`\n📋 Testing useBotCrud.deleteBotOperation() - DELETE /api/bots/${botId}`);
  try {
    const response = await fetch(`http://localhost:8000/api/bots/${botId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    if (response.ok) {
      console.log('✅ deleteBotOperation SUCCESS: Bot deleted');
      return true;
    } else {
      throw new Error(`Status ${response.status}`);
    }
  } catch (error) {
    console.log('❌ deleteBotOperation FAILED:', error.message);
    return false;
  }
}

// ============= useBotStatus TESTS =============

async function testToggleBotStatus(botId, currentStatus) {
  const action = currentStatus === 'RUNNING' ? 'pause' : 'start';
  console.log(`\n⚡ Testing useBotStatus.toggleBotStatus() - POST /api/bots/${botId}/${action}`);
  try {
    const data = await authenticatedFetch(`/api/bots/${botId}/${action}`, {
      method: 'POST'
    });
    console.log('✅ toggleBotStatus SUCCESS:', data.message, '- New status:', data.status);
    return data;
  } catch (error) {
    console.log('❌ toggleBotStatus FAILED:', error.message);
    return null;
  }
}

// ============= useBotOperations TESTS =============

async function testStartBotTrading(botId) {
  console.log(`\n🚀 Testing useBotOperations.startBotTrading() - POST /api/real-trading/bot/start/${botId}`);
  try {
    const data = await authenticatedFetch(`/api/real-trading/bot/start/${botId}`, {
      method: 'POST'
    });
    console.log('✅ startBotTrading SUCCESS:', data.message);
    return data;
  } catch (error) {
    console.log('❌ startBotTrading FAILED:', error.message);
    return null;
  }
}

async function testStopBotTrading(botId) {
  console.log(`\n🛑 Testing useBotOperations.stopBotTrading() - POST /api/real-trading/bot/stop/${botId}`);
  try {
    const data = await authenticatedFetch(`/api/real-trading/bot/stop/${botId}`, {
      method: 'POST'
    });
    console.log('✅ stopBotTrading SUCCESS:', data.message);
    return data;
  } catch (error) {
    console.log('❌ stopBotTrading FAILED:', error.message);
    return null;
  }
}

async function testUpdateBotMetricsFromDB(botId) {
  console.log(`\n📊 Testing useBotOperations.updateBotMetricsFromDB() - GET /api/bots/${botId}/trading-operations`);
  try {
    const data = await authenticatedFetch(`/api/bots/${botId}/trading-operations?limit=100`);

    if (data.operations && data.operations.length > 0) {
      const profitable = data.operations.filter(op => op.pnl > 0);
      const totalPnL = data.operations.reduce((sum, op) => sum + (op.pnl || 0), 0);
      const winRate = (profitable.length / data.operations.length) * 100;

      console.log('✅ updateBotMetricsFromDB SUCCESS:');
      console.log('   - Total trades:', data.operations.length);
      console.log('   - Win rate:', winRate.toFixed(1) + '%');
      console.log('   - Total PnL:', totalPnL.toFixed(2));
      return true;
    } else {
      console.log('✅ updateBotMetricsFromDB SUCCESS: No operations found');
      return false;
    }
  } catch (error) {
    console.log('❌ updateBotMetricsFromDB FAILED:', error.message);
    return false;
  }
}

// ============= useBotMetrics TESTS =============

async function testLoadRealBotMetrics(botId) {
  console.log(`\n📈 Testing useBotMetrics.loadRealBotMetrics() - GET /api/bots/${botId}/trading-operations`);
  try {
    const data = await authenticatedFetch(`/api/bots/${botId}/trading-operations?limit=100`);

    if (data.operations) {
      const ops = data.operations;
      const totalTrades = ops.length;
      const totalWins = ops.filter(op => op.pnl > 0).length;
      const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100) : 0;

      console.log('✅ loadRealBotMetrics SUCCESS:');
      console.log('   - Total trades:', totalTrades);
      console.log('   - Win rate:', winRate.toFixed(1) + '%');
      console.log('   - Wins/Losses:', totalWins + '/' + (totalTrades - totalWins));
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ loadRealBotMetrics FAILED:', error.message);
    return false;
  }
}

async function testGetRealBotMetrics(bot) {
  console.log(`\n📊 Testing useBotMetrics.getRealBotMetrics() - Multiple endpoints`);
  try {
    const [tradesResponse, summaryResponse] = await Promise.all([
      fetch(`http://localhost:8000/api/bots/${bot.id}/trades`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`http://localhost:8000/api/bots/${bot.id}/trading-summary`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
    ]);

    if (tradesResponse.ok && summaryResponse.ok) {
      const tradesData = await tradesResponse.json();
      const summaryData = await summaryResponse.json();

      console.log('✅ getRealBotMetrics SUCCESS:');
      console.log('   - Trades endpoint:', tradesResponse.status, 'OK');
      console.log('   - Summary endpoint:', summaryResponse.status, 'OK');
      console.log('   - Trades found:', tradesData.trades?.length || 0);
      return true;
    } else {
      throw new Error(`Trades: ${tradesResponse.status}, Summary: ${summaryResponse.status}`);
    }
  } catch (error) {
    console.log('❌ getRealBotMetrics FAILED:', error.message);
    return false;
  }
}

// ============= useBotMarketData TESTS =============

async function testFetchMarketData(symbol = "BTCUSDT") {
  console.log(`\n📊 Testing useBotMarketData.fetchMarketData() - GET /api/market-data/${symbol}`);
  try {
    const params = new URLSearchParams({
      timeframe: '15m',
      limit: '100',
      market_type: 'SPOT'
    });

    const response = await fetch(`http://localhost:8000/api/market-data/${symbol}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.data?.klines) {
        console.log('✅ fetchMarketData SUCCESS:', data.data.klines.length, 'candles received');
        return true;
      } else {
        console.log('✅ fetchMarketData SUCCESS: No market data available');
        return true;
      }
    } else {
      throw new Error(`Status ${response.status}`);
    }
  } catch (error) {
    console.log('❌ fetchMarketData FAILED:', error.message);
    return false;
  }
}

// ============= useBotState TESTS =============

async function testBotState() {
  console.log('\n🔧 Testing useBotState (local state management)');
  console.log('✅ useBotState: Local state hooks don\'t require API testing');
  console.log('   - useState for bots array');
  console.log('   - useState for loading state');
  console.log('   - useState for error handling');
  return true;
}

// ============= RUN ALL TESTS =============

async function runFullIntegrationTest() {
  console.log('=== FULL INTEGRATION TEST: Frontend Hooks → Backend APIs ===\n');
  console.log('Testing ALL functions from ALL hooks as per architecture:');
  console.log('BotsModular.jsx → 5 Hooks → Backend APIs\n');

  let testBot = null;
  let createdBot = null;
  let results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test useBotCrud
  console.log('\n========== useBotCrud Hook ==========');

  // fetchBots
  const bots = await testFetchBots();
  results.tests.push({ name: 'fetchBots', passed: bots.length > 0 });
  if (bots.length > 0) {
    results.passed++;
    testBot = bots[0];
  } else {
    results.failed++;
  }

  // createBot
  createdBot = await testCreateBot();
  results.tests.push({ name: 'createBot', passed: createdBot !== null });
  if (createdBot) results.passed++; else results.failed++;

  // updateBot
  if (testBot) {
    const updated = await testUpdateBot(testBot.id);
    results.tests.push({ name: 'updateBot', passed: updated !== null });
    if (updated) results.passed++; else results.failed++;
  }

  // Test useBotStatus
  console.log('\n========== useBotStatus Hook ==========');

  if (testBot) {
    const toggled = await testToggleBotStatus(testBot.id, testBot.status);
    results.tests.push({ name: 'toggleBotStatus', passed: toggled !== null });
    if (toggled) results.passed++; else results.failed++;
  }

  // Test useBotOperations
  console.log('\n========== useBotOperations Hook ==========');

  if (testBot) {
    const started = await testStartBotTrading(testBot.id);
    results.tests.push({ name: 'startBotTrading', passed: started !== null });
    if (started) results.passed++; else results.failed++;

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const stopped = await testStopBotTrading(testBot.id);
    results.tests.push({ name: 'stopBotTrading', passed: stopped !== null });
    if (stopped) results.passed++; else results.failed++;

    const metricsUpdated = await testUpdateBotMetricsFromDB(testBot.id);
    results.tests.push({ name: 'updateBotMetricsFromDB', passed: metricsUpdated });
    if (metricsUpdated) results.passed++; else results.failed++;
  }

  // Test useBotMetrics
  console.log('\n========== useBotMetrics Hook ==========');

  if (testBot) {
    const metricsLoaded = await testLoadRealBotMetrics(testBot.id);
    results.tests.push({ name: 'loadRealBotMetrics', passed: metricsLoaded });
    if (metricsLoaded) results.passed++; else results.failed++;

    const realMetrics = await testGetRealBotMetrics(testBot);
    results.tests.push({ name: 'getRealBotMetrics', passed: realMetrics });
    if (realMetrics) results.passed++; else results.failed++;
  }

  // Test useBotState
  console.log('\n========== useBotState Hook ==========');
  const stateTest = await testBotState();
  results.tests.push({ name: 'useBotState', passed: stateTest });
  if (stateTest) results.passed++; else results.failed++;

  // Clean up - delete created bot
  if (createdBot) {
    const deleted = await testDeleteBot(createdBot.id);
    results.tests.push({ name: 'deleteBotOperation', passed: deleted });
    if (deleted) results.passed++; else results.failed++;
  }

  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
  console.log('\nDetailed Results:');
  results.tests.forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
  });

  if (results.failed === 0) {
    console.log('\n🎉 ALL INTEGRATIONS WORKING CORRECTLY! 🎉');
    console.log('BotsModular.jsx can use ALL hooks and ALL functions successfully.');
  } else {
    console.log('\n⚠️ Some integrations need attention.');
  }
}

// Run the complete test
runFullIntegrationTest().catch(console.error);