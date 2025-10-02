# services/wyckoff/distribution.py
import numpy as np
from typing import Dict, Any

def detect_distribution_signals(
    opens: np.ndarray,
    highs: np.ndarray,
    lows: np.ndarray,
    closes: np.ndarray,
    volumes: np.ndarray,
    atr: float,
    range_low: float,
    range_high: float,
    bot_config: Any
) -> Dict[str, Any]:
    """Detecta las 6 señales de FASE DISTRIBUCIÓN"""
    signals = {}

    # 10. PSY - Preliminary Supply
    if len(closes) >= 10:
        prior_uptrend = all(closes[i] > closes[i-1] for i in range(-10, 0))
    else:
        prior_uptrend = False

    if len(volumes) >= 20:
        vol_increase = volumes[-1] > volumes[-20:].mean() * bot_config.wyckoff_vol_increase_factor
    else:
        vol_increase = False

    if len(highs) >= 20:
        resistance_touches = sum(1 for i in range(-20, 0) if abs(highs[i] - range_high) < atr * bot_config.wyckoff_atr_factor)
    else:
        resistance_touches = 0

    if range_high > 0:
        rejection = (range_high - closes[-1]) / range_high > bot_config.wyckoff_rejection_threshold
    else:
        rejection = False

    if prior_uptrend and vol_increase and resistance_touches >= bot_config.wyckoff_resistance_touches_min and rejection:
        signals['psy'] = {
            'detected': True,
            'price_level': float(range_high),
            'confidence': 0.7
        }
    else:
        signals['psy'] = {
            'detected': False,
            'price_level': 0.0,
            'confidence': 0.0
        }

    # 11. BC - Buying Climax
    if len(volumes) >= 50:
        vol_climax = volumes[-1] > volumes[-50:].mean() * bot_config.wyckoff_vol_climax_factor
    else:
        vol_climax = False

    if len(highs) >= 51:
        new_high = highs[-1] > max(highs[-50:-1])
    else:
        new_high = False

    mid_close = closes[-1] < highs[-1] - (highs[-1] - lows[-1]) * 0.5

    if atr > 0:
        wick_size = (highs[-1] - max(opens[-1], closes[-1])) / atr
    else:
        wick_size = 0

    if vol_climax and new_high and mid_close and wick_size > bot_config.wyckoff_wick_size_min:
        signals['bc'] = {
            'detected': True,
            'bc_high': float(highs[-1]),
            'confidence': 0.85
        }
    else:
        signals['bc'] = {
            'detected': False,
            'bc_high': 0.0,
            'confidence': 0.0
        }

    # 12. AR - Automatic Reaction (Distribution)
    if signals['bc']['detected']:
        bc_high = signals['bc']['bc_high']
        if bc_high > 0:
            decline_pct = (bc_high - lows[-1]) / bc_high
        else:
            decline_pct = 0

        if len(volumes) >= 3:
            vol_decreasing = volumes[-1] < volumes[-3:].mean()
        else:
            vol_decreasing = False

        if decline_pct > bot_config.wyckoff_ar_decline_pct and vol_decreasing:
            signals['ar_dist'] = {
                'detected': True,
                'ar_low': float(lows[-1]),
                'confidence': 0.75
            }
        else:
            signals['ar_dist'] = {
                'detected': False,
                'ar_low': 0.0,
                'confidence': 0.0
            }
    else:
        signals['ar_dist'] = {
            'detected': False,
            'ar_low': 0.0,
            'confidence': 0.0
        }

    # 13. ST - Secondary Test (Distribution)
    if signals['bc']['detected']:
        bc_high = signals['bc']['bc_high']
        if len(volumes) >= 50:
            bc_volume = volumes[-50:].mean() * bot_config.wyckoff_vol_climax_factor
        else:
            bc_volume = volumes[-1]

        ar_low = signals.get('ar_dist', {}).get('ar_low', lows[-1])

        if bc_high > 0:
            near_bc = abs(highs[-1] - bc_high) / bc_high < bot_config.wyckoff_near_threshold
        else:
            near_bc = False

        vol_reduced = volumes[-1] < bc_volume * bot_config.wyckoff_vol_reduced_factor
        no_break = highs[-1] <= bc_high
        below_mid = closes[-1] < (bc_high + ar_low) / 2

        if near_bc and vol_reduced and no_break and below_mid:
            signals['st_dist'] = {
                'detected': True,
                'st_high': float(highs[-1]),
                'confidence': 0.8
            }
        else:
            signals['st_dist'] = {
                'detected': False,
                'st_high': 0.0,
                'confidence': 0.0
            }
    else:
        signals['st_dist'] = {
            'detected': False,
            'st_high': 0.0,
            'confidence': 0.0
        }

    # 14. LPSY - Last Point of Supply
    resistance_level = range_high
    test_resistance = abs(highs[-1] - resistance_level) < atr * bot_config.wyckoff_test_atr_factor

    if len(volumes) >= 100:
        min_volume = volumes[-1] < min(volumes[-100:])
    else:
        min_volume = False

    weak_close = closes[-1] < resistance_level - atr * bot_config.wyckoff_weak_close_factor

    if test_resistance and min_volume and weak_close:
        signals['lpsy'] = {
            'detected': True,
            'lpsy_level': float(highs[-1]),
            'confidence': 0.9
        }
    else:
        signals['lpsy'] = {
            'detected': False,
            'lpsy_level': 0.0,
            'confidence': 0.0
        }

    # 15. UTAD - Upthrust After Distribution - Ya implementado en GAP #1

    return signals