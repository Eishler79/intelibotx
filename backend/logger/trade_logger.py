# logger/trade_logger.py

import json
from datetime import datetime
from pathlib import Path

OPERATIONS_FILE = Path("data/operations.json")
OPERATIONS_FILE.parent.mkdir(parents=True, exist_ok=True)  # Crea /data si no existe

def log_operation(operation: dict):
    operation["timestamp"] = datetime.utcnow().isoformat()

    if OPERATIONS_FILE.exists():
        with open(OPERATIONS_FILE, "r") as f:
            data = json.load(f)
    else:
        data = []

    data.append(operation)

    with open(OPERATIONS_FILE, "w") as f:
        json.dump(data, f, indent=2)