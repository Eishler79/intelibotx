# TEST PLAN - GAP #3: 18 WYCKOFF SIGNALS

## 1. UNIT TESTS - SEÑALES INDIVIDUALES

### Test Accumulation Phase
```python
# test_wyckoff_accumulation.py
import numpy as np
from services.wyckoff.accumulation import detect_accumulation_signals

def test_ps_detection():
    """Test Preliminary Support detection"""
    # Prepare test data
    closes = np.array([100, 99, 98, 97, 96, 95, 94, 93, 92, 95])  # Downtrend then bounce
    volumes = np.array([1000] * 19 + [2000])  # Volume spike

    # Mock bot_config
    class BotConfig:
        wyckoff_vol_increase_factor = 1.5
        wyckoff_atr_factor = 0.5
        wyckoff_support_touches_min = 2
        wyckoff_rebound_threshold = 0.02

    signals = detect_accumulation_signals(
        opens=closes, highs=closes+1, lows=closes-1,
        closes=closes, volumes=volumes[-20:],
        atr=1.0, range_low=92, range_high=100,
        bot_config=BotConfig()
    )

    assert 'ps' in signals
    assert isinstance(signals['ps']['detected'], bool)

def test_sc_detection():
    """Test Selling Climax detection"""
    # Volume climax + new low + mid close
    pass

def test_ar_detection():
    """Test Automatic Rally detection"""
    # Requires SC first
    pass

def test_st_detection():
    """Test Secondary Test detection"""
    # Requires SC first
    pass

def test_lps_detection():
    """Test Last Point Support detection"""
    pass
```

### Test Markup Phase
```python
# test_wyckoff_markup.py
from services.wyckoff.markup import detect_markup_signals

def test_sos_detection():
    """Test Sign of Strength detection"""
    pass

def test_bu_markup_detection():
    """Test Backup detection in markup"""
    pass

def test_joc_markup_detection():
    """Test Jump over Creek detection"""
    pass
```

### Test Distribution Phase
```python
# test_wyckoff_distribution.py
from services.wyckoff.distribution import detect_distribution_signals

def test_psy_detection():
    """Test Preliminary Supply detection"""
    pass

def test_bc_detection():
    """Test Buying Climax detection"""
    pass

def test_ar_dist_detection():
    """Test Automatic Reaction distribution detection"""
    pass

def test_st_dist_detection():
    """Test Secondary Test distribution detection"""
    pass

def test_lpsy_detection():
    """Test Last Point Supply detection"""
    pass
```

### Test Markdown Phase
```python
# test_wyckoff_markdown.py
from services.wyckoff.markdown import detect_markdown_signals

def test_sow_detection():
    """Test Sign of Weakness detection"""
    pass

def test_bu_markdown_detection():
    """Test Backup detection in markdown"""
    pass

def test_joc_markdown_detection():
    """Test Jump over Creek markdown detection"""
    pass
```

## 2. INTEGRATION TESTS

### Test Signal Integration
```bash
# Test API endpoint with 18 signals
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.analysis.wyckoff_analysis.details.wyckoff_signals | keys'

# Expected: 16 keys (Spring/UTAD already exist)
# ["ps", "sc", "ar", "st", "lps", "sos", "bu_markup", "joc_markup",
#  "psy", "bc", "ar_dist", "st_dist", "lpsy", "sow", "bu_markdown", "joc_markdown"]
```

### Test Performance
```python
# test_performance.py
import time
import requests

def test_response_time():
    """Test response time with dynamic candles"""
    times = []
    for _ in range(10):
        start = time.time()
        response = requests.post(
            'http://localhost:8000/api/run-smart-trade/BTCUSDT',
            headers={'Authorization': f'Bearer {token}'}
        )
        times.append(time.time() - start)

    avg_time = sum(times) / len(times)
    assert avg_time < 0.3, f"Response too slow: {avg_time}s"
```

### Test Data Requirements
```python
# test_data_requirements.py

def test_1m_timeframe():
    """Test 1m requires 2000 candles"""
    from routes.bots import calculate_required_candles
    assert calculate_required_candles('1m') == 2000

def test_1h_timeframe():
    """Test 1h requires 120 candles"""
    from routes.bots import calculate_required_candles
    assert calculate_required_candles('1h') == 120

def test_unknown_timeframe():
    """Test unknown defaults to 100"""
    from routes.bots import calculate_required_candles
    assert calculate_required_candles('2h') == 100
```

## 3. VALIDATION TESTS

### Test Config Fields
```python
# test_bot_config.py
from models.bot_config import BotConfig

def test_wyckoff_fields():
    """Test all 27 Wyckoff fields exist"""
    bot = BotConfig(
        user_id=1,
        name="Test",
        symbol="BTCUSDT",
        base_currency="USDT",
        quote_currency="BTC",
        stake=100,
        strategy="Smart Scalper",
        interval="15m",
        take_profit=1.0,
        stop_loss=1.0,
        market_type="SPOT",
        entry_order_type="MARKET",
        exit_order_type="MARKET",
        tp_order_type="LIMIT",
        sl_order_type="STOP_MARKET",
        trailing_stop=False,
        max_open_positions=1,
        cooldown_minutes=5
    )

    # Check all 27 fields exist
    assert hasattr(bot, 'wyckoff_vol_increase_factor')
    assert hasattr(bot, 'wyckoff_atr_factor')
    assert hasattr(bot, 'wyckoff_support_touches_min')
    # ... check all 27 fields
```

### Test No Hardcodes
```bash
# Verify no hardcoded values
grep -r "1\.5\|2\.0\|3\.0" services/wyckoff/*.py | grep -v "bot_config"
# Should return nothing

# Verify all values from bot_config
grep -r "bot_config\.wyckoff_" services/wyckoff/*.py | wc -l
# Should return 50+ occurrences
```

## 4. REGRESSION TESTS

### Test Existing Features
```bash
# Test Spring/UTAD still work
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT | \
  jq '.analysis.wyckoff_analysis.details.spring_utad_detection'

# Test other algorithms still work
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT | \
  jq '.analysis | keys'
# Should see all 6 algorithms
```

## 5. EXECUTION COMMANDS

```bash
# Run all tests
cd backend

# Unit tests
pytest test_wyckoff_accumulation.py -v
pytest test_wyckoff_markup.py -v
pytest test_wyckoff_distribution.py -v
pytest test_wyckoff_markdown.py -v

# Integration tests
pytest test_performance.py -v
pytest test_data_requirements.py -v

# Config tests
pytest test_bot_config.py -v

# Manual validation
./test_manual_validation.sh
```

## SUCCESS CRITERIA
- [ ] All 16 new signals detected
- [ ] Spring/UTAD still functional
- [ ] Response time < 300ms
- [ ] No hardcoded values
- [ ] All values from bot_config
- [ ] Functions < 150 lines (except distribution.py at 178)
- [ ] Dynamic candle calculation working