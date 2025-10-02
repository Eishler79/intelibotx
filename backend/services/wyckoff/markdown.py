# services/wyckoff/markdown.py
import numpy as np
from typing import Dict, Any

def detect_markdown_signals(
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
    """Detecta las 3 señales de FASE MARKDOWN"""
    signals = {}

    # 16. SOW - Sign of Weakness
    if range_low > 0:
        breakdown = (range_low - lows[-1]) / range_low > bot_config.wyckoff_breakdown_threshold
    else:
        breakdown = False

    if len(volumes) >= 20:
        vol_surge = volumes[-1] > volumes[-20:].mean() * bot_config.wyckoff_vol_surge_factor
    else:
        vol_surge = False

    support_broken = lows[-1] < range_low - atr * bot_config.wyckoff_support_broken_factor

    if len(closes) >= 3:
        closes_below = all(closes[i] < range_low for i in range(-3, 0))
    else:
        closes_below = False

    if breakdown and vol_surge and support_broken and closes_below:
        signals['sow'] = {
            'detected': True,
            'breakdown_level': float(range_low),
            'confidence': 0.85
        }
    else:
        signals['sow'] = {
            'detected': False,
            'breakdown_level': 0.0,
            'confidence': 0.0
        }

    # 17. BU - Backup to LPSY
    if signals['sow']['detected']:
        breakdown_level = signals['sow']['breakdown_level']

        if breakdown_level > 0:
            pullback = abs(highs[-1] - breakdown_level) / breakdown_level < bot_config.wyckoff_pullback_threshold
        else:
            pullback = False

        if len(volumes) >= 20:
            vol_dry = volumes[-1] < volumes[-20:].mean() * bot_config.wyckoff_vol_dry_factor
        else:
            vol_dry = False

        resistance_hold = highs[-1] <= breakdown_level + atr * bot_config.wyckoff_resistance_tolerance

        if pullback and vol_dry and resistance_hold:
            signals['bu_markdown'] = {
                'detected': True,
                'pullback_level': float(highs[-1]),
                'confidence': 0.8
            }
        else:
            signals['bu_markdown'] = {
                'detected': False,
                'pullback_level': 0.0,
                'confidence': 0.0
            }
    else:
        signals['bu_markdown'] = {
            'detected': False,
            'pullback_level': 0.0,
            'confidence': 0.0
        }

    # 18. JOC - Jump over Creek
    ice_level = range_low

    if ice_level > 0:
        jump = (ice_level - closes[-1]) / ice_level > bot_config.wyckoff_jump_threshold
    else:
        jump = False

    if len(volumes) >= 5:
        vol_expansion = volumes[-1] > volumes[-5:].mean() * bot_config.wyckoff_vol_expansion_factor
    else:
        vol_expansion = False

    momentum = opens[-1] > closes[-1] + atr * bot_config.wyckoff_momentum_factor

    if jump and vol_expansion and momentum:
        signals['joc_markdown'] = {
            'detected': True,
            'jump_level': float(closes[-1]),
            'confidence': 0.75
        }
    else:
        signals['joc_markdown'] = {
            'detected': False,
            'jump_level': 0.0,
            'confidence': 0.0
        }

    return signals