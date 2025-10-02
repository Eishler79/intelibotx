# services/wyckoff/accumulation.py
import numpy as np
from typing import Dict, Any

def detect_accumulation_signals(
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
    """Detecta las 6 señales de FASE ACUMULACIÓN"""
    signals = {}

    # 1. PS - Preliminary Support
    if len(closes) >= 10:
        prior_downtrend = all(closes[i] < closes[i-1] for i in range(-10, 0))
    else:
        prior_downtrend = False

    if len(volumes) >= 20:
        vol_increase = volumes[-1] > volumes[-20:].mean() * bot_config.wyckoff_vol_increase_factor
    else:
        vol_increase = False

    if len(lows) >= 20:
        support_touches = sum(1 for i in range(-20, 0) if abs(lows[i] - range_low) < atr * bot_config.wyckoff_atr_factor)
    else:
        support_touches = 0

    if range_low > 0:
        rebound = (closes[-1] - range_low) / range_low > bot_config.wyckoff_rebound_threshold
    else:
        rebound = False

    if prior_downtrend and vol_increase and support_touches >= bot_config.wyckoff_support_touches_min and rebound:
        signals['ps'] = {
            'detected': True,
            'price_level': float(range_low),
            'confidence': 0.7
        }
    else:
        signals['ps'] = {
            'detected': False,
            'price_level': 0.0,
            'confidence': 0.0
        }

    # 2. SC - Selling Climax
    if len(volumes) >= 50:
        vol_climax = volumes[-1] > volumes[-50:].mean() * bot_config.wyckoff_vol_climax_factor
    else:
        vol_climax = False

    if len(lows) >= 51:
        new_low = lows[-1] < min(lows[-50:-1])
    else:
        new_low = False

    mid_close = closes[-1] > lows[-1] + (highs[-1] - lows[-1]) * 0.5

    if atr > 0:
        wick_size = (min(opens[-1], closes[-1]) - lows[-1]) / atr
    else:
        wick_size = 0

    if vol_climax and new_low and mid_close and wick_size > bot_config.wyckoff_wick_size_min:
        signals['sc'] = {
            'detected': True,
            'sc_low': float(lows[-1]),
            'confidence': 0.85
        }
    else:
        signals['sc'] = {
            'detected': False,
            'sc_low': 0.0,
            'confidence': 0.0
        }

    # 3. AR - Automatic Rally
    if signals['sc']['detected']:
        sc_low = signals['sc']['sc_low']
        if sc_low > 0:
            rebound_pct = (highs[-1] - sc_low) / sc_low
        else:
            rebound_pct = 0

        if len(volumes) >= 3:
            vol_decreasing = volumes[-1] < volumes[-3:].mean()
        else:
            vol_decreasing = False

        if rebound_pct > bot_config.wyckoff_ar_rebound_pct and vol_decreasing:
            signals['ar'] = {
                'detected': True,
                'ar_high': float(highs[-1]),
                'confidence': 0.75
            }
        else:
            signals['ar'] = {
                'detected': False,
                'ar_high': 0.0,
                'confidence': 0.0
            }
    else:
        signals['ar'] = {
            'detected': False,
            'ar_high': 0.0,
            'confidence': 0.0
        }

    # 4. ST - Secondary Test
    if signals['sc']['detected']:
        sc_low = signals['sc']['sc_low']
        if len(volumes) >= 50:
            sc_volume = volumes[-50:].mean() * bot_config.wyckoff_vol_climax_factor
        else:
            sc_volume = volumes[-1]

        ar_high = signals.get('ar', {}).get('ar_high', highs[-1])

        if sc_low > 0:
            near_sc = abs(lows[-1] - sc_low) / sc_low < bot_config.wyckoff_near_threshold
        else:
            near_sc = False

        vol_reduced = volumes[-1] < sc_volume * bot_config.wyckoff_vol_reduced_factor
        no_break = lows[-1] >= sc_low
        above_mid = closes[-1] > (sc_low + ar_high) / 2

        if near_sc and vol_reduced and no_break and above_mid:
            signals['st'] = {
                'detected': True,
                'st_low': float(lows[-1]),
                'confidence': 0.8
            }
        else:
            signals['st'] = {
                'detected': False,
                'st_low': 0.0,
                'confidence': 0.0
            }
    else:
        signals['st'] = {
            'detected': False,
            'st_low': 0.0,
            'confidence': 0.0
        }

    # 5. LPS - Last Point of Support
    support_level = range_low
    test_support = abs(lows[-1] - support_level) < atr * bot_config.wyckoff_test_atr_factor

    if len(volumes) >= 100:
        min_volume = volumes[-1] < min(volumes[-100:])
    else:
        min_volume = False

    strong_close = closes[-1] > support_level + atr * bot_config.wyckoff_strong_close_factor

    if test_support and min_volume and strong_close:
        signals['lps'] = {
            'detected': True,
            'lps_level': float(lows[-1]),
            'confidence': 0.9
        }
    else:
        signals['lps'] = {
            'detected': False,
            'lps_level': 0.0,
            'confidence': 0.0
        }

    # 6. Spring - Ya implementado en GAP #1
    # Se mantiene is_spring existente en signal_quality_assessor

    return signals