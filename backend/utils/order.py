from decimal import Decimal
import math

def quantize_qty(raw_qty: float, step_size: float) -> str:
    """
    Ajusta 'raw_qty' al siguiente múltiplo de 'step_size' (redondeo hacia arriba).
    """
    q = Decimal(str(raw_qty))
    s = Decimal(str(step_size))
    steps = math.ceil(q / s)
    q_up = (Decimal(steps) * s).quantize(s)
    return format(q_up, "f").rstrip("0").rstrip(".")