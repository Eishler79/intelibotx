# test_news_engine.py

from analytics.news_engine import NewsAnalyzer

# Configuración del analizador
news_analyzer = NewsAnalyzer(
    symbols=["BTC", "ETH"],
    keywords=["inflation", "rate hike", "SEC", "ETF", "approval", "Binance", "crypto regulation", "Elon Musk", "Trump"]
)

print("🔍 Consultando calendario económico...")
calendar_data = news_analyzer.get_calendar_events()
print(f"\n📅 Eventos próximos relevantes:\n")
for event in calendar_data[:5]:  # muestra los primeros 5
    print(f"- {event['title']} ({event['date']}) | Impacto: {event['impact']}")

print("\n🗞️ Buscando noticias relevantes...")
news = news_analyzer.search_news()
print(f"\n📰 Últimos titulares relevantes:\n")
for item in news[:5]:  # muestra los primeros 5
    print(f"- [{item['symbol']}] {item['headline']} (Fuente: {item['source']})")