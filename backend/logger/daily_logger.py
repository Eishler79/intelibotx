# logger/daily_logger.py

from datetime import datetime
from pathlib import Path

LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

def log_operation_detail(operation: dict):
    now = datetime.utcnow()
    date_str = now.strftime("%Y-%m-%d")
    log_file = LOGS_DIR / f"{date_str}.log"
    
    log_line = (
        f"[{now.isoformat()}] | "
        f"{operation.get('symbol')} | "
        f"{operation.get('interval')} | "
        f"{operation.get('action')} | "
        f"{operation.get('status')} | "
        f"${operation.get('stake')} | "
        f"{operation.get('reason')}\n"
    )

    with open(log_file, "a") as f:
        f.write(log_line)