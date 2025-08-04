import pandas as pd
import matplotlib.pyplot as plt
import plotly.express as px
import os
from intelligence.smart_trade_intelligence import SmartTradeIntelligence
from datetime import datetime
import random

REPORTS_DIR = "reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

class SmartTradeSimulator:
    def __init__(self, symbol: str, interval: str = "15m", capital: float = 1000.0):
        self.symbol = symbol.upper()
        self.interval = interval
        self.initial_capital = capital
        self.remaining_capital = capital
        self.total_profit = 0.0
        self.trades_executed = []

    def run(self, max_profit_target=200.0):
        intelligence = SmartTradeIntelligence(self.symbol, self.interval)
        df = intelligence.fetch_candles()
        print(f"\n📊 Ejecutando simulación para {self.symbol} [{self.interval}] con capital inicial ${self.initial_capital}\n")

        for i in range(len(df) - 1):
            window_df = df.iloc[:i + 1]
            intelligence.fetch_candles = lambda: window_df
            result = intelligence.analyze(show_dashboard=False, auto_decision=True)

            decision = result.get("auto_decision", {})
            if decision.get("action") in ["long", "short"]:
                entry_price = window_df['close'].iloc[-1]
                stake = self._next_stake()
                if stake == 0.0:
                    continue

                tp_levels = [0.007, 0.008, 0.01]
                for tp in tp_levels:
                    exit_price = entry_price * (1 + tp) if decision['action'] == 'long' else entry_price * (1 - tp)
                    profit = (exit_price - entry_price) * (stake / entry_price) if decision['action'] == 'long' else (entry_price - exit_price) * (stake / entry_price)

                    self.total_profit += profit
                    self.remaining_capital += profit

                    self.trades_executed.append({
                        "entry_price": round(entry_price, 4),
                        "exit_price": round(exit_price, 4),
                        "profit": round(profit, 2),
                        "type": decision['action'],
                        "stake": stake,
                        "timestamp": window_df.index[-1],
                        "reason": decision.get("reason", "N/A"),
                        "score": decision.get("score", 0),
                        "score_components": decision.get("score_components", [])
                    })

                    print(f"✔️ {decision['action'].upper()} ejecutada - Stake ${stake} - Profit: ${profit:.2f} - {window_df.index[-1]} - {decision.get('reason', '')}")
                    if self.total_profit >= max_profit_target:
                        print("\n🎯 Objetivo alcanzado!")
                        self._generate_report()
                        return self.trades_executed
                    break
        print("\n📉 Simulación finalizada. No se alcanzó el objetivo.")
        self._generate_report()
        return self.trades_executed

    def _next_stake(self):
        for amount in [15, 20, 30, 40]:
            if self.remaining_capital >= amount:
                self.remaining_capital -= amount
                return amount
        return 0.0

    def _generate_report(self):
        if not self.trades_executed:
            print("⚠️ No se realizaron operaciones.")
            return

        df = pd.DataFrame(self.trades_executed)
        df["cumulative_profit"] = df["profit"].cumsum()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"{self.symbol}_{self.interval}_{timestamp}"

        # Exportar HTML dashboard con Plotly
        fig = px.line(df, x="timestamp", y="cumulative_profit", title="Ganancia Acumulada")
        fig.write_html(f"{REPORTS_DIR}/{base_filename}_dashboard.html")

        # Plot matplotlib para frecuencia de razones
        plt.figure(figsize=(10, 4))
        df['reason'].value_counts().plot(kind='bar')
        plt.title("Frecuencia de razones de entrada")
        plt.tight_layout()
        plt.savefig(f"{REPORTS_DIR}/{base_filename}_reasons.png")
        plt.close()

        # Exportar score components si existen
        if 'score_components' in df.columns:
            with open(f"{REPORTS_DIR}/{base_filename}_components.txt", "w") as f:
                for i, row in df.iterrows():
                    f.write(f"{row['timestamp']} - {row['type']} - {row['reason']}\n")
                    for c in row['score_components']:
                        f.write(f"   - {c}\n")
                    f.write("\n")

        print(f"\n📁 Reportes generados en: {REPORTS_DIR}/")
        print(f"📄 Dashboard: {base_filename}_dashboard.html")
        print(f"📊 Razones:   {base_filename}_reasons.png")
        print(f"📘 Componentes: {base_filename}_components.txt\n")