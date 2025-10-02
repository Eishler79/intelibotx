# REGRESSION PREVENTION STRATEGY - GAP #2 ATR Normalization

## PATTERN ESTABLISHED
**ATR-Based Normalization Pattern**
- ALL thresholds MUST use ATR normalization
- NO hardcoded values (0.01, 0.02, etc.)
- Dynamic adaptation to market volatility
- Professional institutional standard

## CODING STANDARDS
```python
# PATTERN: ATR Normalization
# CORRECT:
atr = calculate_atr(highs.tolist(), lows.tolist(), closes.tolist(), period=14) or 1e-9
normalized_value = raw_value / atr

# INCORRECT (NEVER USE):
atr = 0.01  # Hardcoded placeholder
threshold = 0.02  # Magic number
```

## REGRESSION TESTS
```python
# test_atr_normalization.py
def test_atr_calculation():
    """Verify ATR is calculated, not hardcoded"""
    assert atr != 0.01  # Never the placeholder value
    assert atr > 0  # Always positive
    assert isinstance(atr, float)

def test_normalized_thresholds():
    """Verify all thresholds use ATR"""
    assert "wick_up/atr" in spring_condition
    assert "wick_down/atr" in utad_condition
    assert "range_height_atr" in response

def test_no_magic_numbers():
    """Ensure no hardcoded thresholds"""
    code = read_file("signal_quality_assessor.py")
    assert "atr = 0.01" not in code
    assert all thresholds use "/atr" pattern
```

## MONITORING CHECKPOINTS
- [ ] ATR calculated from real OHLC data
- [ ] ATR period = 14 (industry standard)
- [ ] Fallback to 1e-9 if insufficient data
- [ ] All wick comparisons normalized by ATR
- [ ] range_height_atr included in response

## REVIEW CHECKLIST FOR FUTURE CHANGES
Before modifying ATR logic:
1. Review this regression prevention document
2. Ensure calculate_atr is called with proper data
3. Test with volatile and calm market conditions
4. Verify all normalizations use real ATR
5. Update tests if adding new ATR-based signals