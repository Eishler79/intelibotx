# services/wyckoff/markup.py
import numpy as np
from typing import Dict, Any

def detect_markup_signals(
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
    """Detecta las 3 señales de FASE MARKUP"""
    signals = {}

    # 7. SOS - Sign of Strength
    if range_high > 0:
        breakout = (highs[-1] - range_high) / range_high > bot_config.wyckoff_breakout_threshold
    else:
        breakout = False

    if len(volumes) >= 20:
        vol_surge = volumes[-1] > volumes[-20:].mean() * bot_config.wyckoff_vol_surge_factor
    else:
        vol_surge = False

    resistance_clear = highs[-1] > range_high + atr * bot_config.wyckoff_resistance_clear_factor

    if len(closes) >= 3:
        closes_above = all(closes[i] > range_high for i in range(-3, 0))
    else:
        closes_above = False

    if breakout and vol_surge and resistance_clear and closes_above:
        signals['sos'] = {
            'detected': True,
            'breakout_level': float(range_high),
            'confidence': 0.85
        }
    else:
        signals['sos'] = {
            'detected': False,
            'breakout_level': 0.0,
            'confidence': 0.0
        }

    # 8. BU - Backup to LPS
    if signals['sos']['detected']:
        breakout_level = signals['sos']['breakout_level']

        if breakout_level > 0:
            pullback = abs(lows[-1] - breakout_level) / breakout_level < bot_config.wyckoff_pullback_threshold
        else:
            pullback = False

        if len(volumes) >= 20:
            vol_dry = volumes[-1] < volumes[-20:].mean() * bot_config.wyckoff_vol_dry_factor
        else:
            vol_dry = False

        support_hold = lows[-1] >= breakout_level - atr * bot_config.wyckoff_support_tolerance

        if pullback and vol_dry and support_hold:
            signals['bu_markup'] = {
                'detected': True,
                'pullback_level': float(lows[-1]),
                'confidence': 0.8
            }
        else:
            signals['bu_markup'] = {
                'detected': False,
                'pullback_level': 0.0,
                'confidence': 0.0
            }
    else:
        signals['bu_markup'] = {
            'detected': False,
            'pullback_level': 0.0,
            'confidence': 0.0
        }

    # 9. JOC - Jump over Creek
    creek_level = range_high

    if creek_level > 0:
        jump = (closes[-1] - creek_level) / creek_level > bot_config.wyckoff_jump_threshold
    else:
        jump = False

    if len(volumes) >= 5:
        vol_expansion = volumes[-1] > volumes[-5:].mean() * bot_config.wyckoff_vol_expansion_factor
    else:
        vol_expansion = False

    momentum = closes[-1] > opens[-1] + atr * bot_config.wyckoff_momentum_factor

    if jump and vol_expansion and momentum:
        signals['joc_markup'] = {
            'detected': True,
            'jump_level': float(closes[-1]),
            'confidence': 0.75
        }
    else:
        signals['joc_markup'] = {
            'detected': False,
            'jump_level': 0.0,
            'confidence': 0.0
        }

    return signals