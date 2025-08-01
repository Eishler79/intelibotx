# services/db_logger.py

import sqlite3
from datetime import datetime

class TradeLogger:
    def __init__(self, db_path="trade_logs.db"):
        self.db_path = db_path
        self._initialize_db()

    def _initialize_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trade_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                direction TEXT NOT NULL,
                entry_price REAL NOT NULL,
                exit_price REAL NOT NULL,
                profit_loss REAL NOT NULL,
                timestamp TEXT NOT NULL
            )
        ''')
        conn.commit()
        conn.close()

    def log_trade(self, symbol: str, direction: str, entry_price: float, exit_price: float):
        profit_loss = exit_price - entry_price if direction.lower() == "long" else entry_price - exit_price
        timestamp = datetime.utcnow().isoformat()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trade_logs (symbol, direction, entry_price, exit_price, profit_loss, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (symbol.upper(), direction.upper(), entry_price, exit_price, profit_loss, timestamp))
        conn.commit()
        conn.close()

    def get_all_trades(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM trade_logs ORDER BY id DESC')
        rows = cursor.fetchall()
        conn.close()
        return rows

    def clear_trades(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM trade_logs')
        conn.commit()
        conn.close()