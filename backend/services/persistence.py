# services/persistence.py

import sqlite3
from datetime import datetime
import pandas as pd

DB_NAME = "backtest_results.db"

def create_tables():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # Tabla para operaciones individuales
    c.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            entry_time TEXT,
            exit_time TEXT,
            entry_price REAL,
            exit_price REAL,
            pnl REAL,
            duration REAL
        )
    ''')

    # Tabla para resumen del backtest
    c.execute('''
        CREATE TABLE IF NOT EXISTS summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            total_trades INTEGER,
            win_rate REAL,
            total_pnl REAL,
            average_duration REAL,
            timestamp TEXT
        )
    ''')

    conn.commit()
    conn.close()

def save_trades(symbol: str, trades: list[dict]):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    for trade in trades:
        c.execute('''
            INSERT INTO trades (symbol, entry_time, exit_time, entry_price, exit_price, pnl, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            symbol,
            trade["entry_time"],
            trade["exit_time"],
            trade["entry_price"],
            trade["exit_price"],
            trade["pnl"],
            trade["duration"]
        ))

    conn.commit()
    conn.close()

def save_summary(symbol: str, summary: dict):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute('''
        INSERT INTO summaries (symbol, total_trades, win_rate, total_pnl, average_duration, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        symbol,
        summary["total_trades"],
        summary["win_rate"],
        summary["total_pnl"],
        summary["average_duration"],
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()