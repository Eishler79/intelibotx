# REGRESSION PREVENTION STRATEGY - GAP #3 18 Wyckoff Signals

## PATTERN ESTABLISHED
**Complete Wyckoff Signal Detection Pattern**
- ALL 18 signals must follow same structure
- Each signal returns dictionary with detected, level, confidence
- No hardcoded thresholds - use ATR normalization
- Dependencies between signals must be explicit

## CODING STANDARDS
```python
# PATTERN: Wyckoff Signal Structure
signal = {
    'detected': bool,  # True/False
    'price_level': float,  # Relevant price
    'confidence': float  # 0.0 to 1.0
}

# NO HARDCODE - Use ATR:
# CORRECT: abs(lows[i] - range_low) < atr * 0.1
# WRONG: abs(lows[i] - range_low) < 10
```

## REGRESSION TESTS
```python
def test_all_18_signals_present():
    """Verify all 18 signals are detected"""
    signals = _detect_all_wyckoff_signals(...)
    expected = ['ps', 'sc', 'ar', 'st', 'lps',
                'sos', 'bu_markup', 'joc_markup',
                'psy', 'bc', 'ar_dist', 'st_dist', 'lpsy',
                'sow', 'bu_markdown', 'joc_markdown']
    for signal in expected:
        assert signal in signals

def test_signal_structure():
    """Verify each signal has required fields"""
    for signal_name, signal_data in signals.items():
        assert 'detected' in signal_data
        assert isinstance(signal_data['detected'], bool)
        assert 'confidence' in signal_data
        assert 0.0 <= signal_data['confidence'] <= 1.0

def test_no_hardcoded_values():
    """Ensure no magic numbers"""
    code = read_file("signal_quality_assessor.py")
    # All thresholds should use ATR multiplication
    assert "atr *" in all_threshold_checks
```

## MONITORING CHECKPOINTS
- [ ] All 18 signals present in response
- [ ] No None values in signal data
- [ ] Confidence scores in valid range
- [ ] Dependencies respected (AR needs SC)
- [ ] No division by zero errors

## REVIEW CHECKLIST FOR FUTURE CHANGES
Before modifying Wyckoff signals:
1. Review this regression prevention document
2. Ensure all 18 signals remain functional
3. Test with insufficient data (< 100 candles)
4. Verify signal dependencies work
5. Check confidence scores are normalized