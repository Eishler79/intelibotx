# REGRESSION PREVENTION STRATEGY - GAP #1

## PATTERN ESTABLISHED
**Wyckoff Signal Detection Pattern**
- All Wyckoff signals MUST follow Spring/UTAD implementation pattern
- Normalize all thresholds with ATR (no hardcoded values)
- Include detection flags in details response
- Maintain scoring system consistency

## CODING STANDARDS
```python
# PATTERN: Wyckoff Signal Detection
def detect_wyckoff_signal(data, atr):
    """
    1. Calculate wicks/ranges
    2. Normalize with ATR
    3. Check conditions (rupture, reversal, volume)
    4. Return detection result with confidence
    """
    pass
```

## REGRESSION TESTS
```python
# test_wyckoff_signals.py
def test_spring_detection():
    """Verify Spring detection with edge cases"""
    assert is_spring when (low < range_low * 0.999
                          and close > range_low
                          and wick_up/atr > 0.6
                          and ultra_vol)

def test_utad_detection():
    """Verify UTAD detection with edge cases"""
    assert is_utad when (high > range_high * 1.001
                        and close < range_high
                        and wick_down/atr > 0.6
                        and ultra_vol)

def test_no_hardcoded_values():
    """Ensure no hardcoded thresholds"""
    assert no values like 0.02, 0.1 in conditions
    assert all thresholds use ATR normalization
```

## MONITORING CHECKPOINTS
- [ ] No hardcoded numeric thresholds
- [ ] All comparisons use ATR-normalized values
- [ ] Detection results included in API response
- [ ] Scoring system maintains 0-100 range

## REVIEW CHECKLIST FOR FUTURE CHANGES
Before modifying _evaluate_wyckoff_analysis:
1. Review this regression prevention document
2. Ensure ATR normalization is maintained
3. Test with extreme market conditions
4. Verify API backwards compatibility
5. Update test cases if adding new signals