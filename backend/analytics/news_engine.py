# analytics/news_engine.py

import requests
from datetime import datetime
import random

class NewsAnalyzer:
    def __init__(self, symbols=None, keywords=None):
        self.symbols = symbols if symbols else ["BTC"]
        self.keywords = keywords if keywords else [
            "inflation", "FED", "ETF", "Binance", "crypto regulation", "Elon Musk", "Trump"
        ]

        self.sources = {
            'forex_factory': 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml',
            'investing': 'https://www.investing.com/economic-calendar/',
        }

    def fetch_forex_factory_events(self):
        try:
            response = requests.get(self.sources['forex_factory'])
            if response.status_code == 200:
                return response.text
            else:
                print(f"❌ Error al obtener datos de Forex Factory: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Excepción al consultar Forex Factory: {e}")
            return None

    def get_calendar_events(self):
        xml_raw = self.fetch_forex_factory_events()
        simulated_events = []

        if xml_raw and 'interest rate decision' in xml_raw.lower():
            simulated_events.append({
                "title": "🔔 Decisión de tasas de interés detectada",
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "impact": "Alto"
            })
        else:
            simulated_events.extend([
                {"title": "📊 NFP Payroll Friday", "date": "2025-07-05", "impact": "Alto"},
                {"title": "🧾 CPI Data Release", "date": "2025-07-07", "impact": "Medio"},
                {"title": "📉 Sentimiento del consumidor", "date": "2025-07-10", "impact": "Bajo"}
            ])

        return simulated_events

    def search_news(self):
        news = []
        for symbol in self.symbols:
            for keyword in self.keywords:
                if random.random() > 0.7:
                    news.append({
                        "symbol": symbol,
                        "headline": f"⚡ {keyword.title()} impacta {symbol}",
                        "source": "Simulado"
                    })
        return news