# test_news_dashboard.py

from analytics.news_engine import NewsAnalyzer
from datetime import datetime
import os

def generate_html_report(events, news, output_file="news_dashboard.html"):
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>🧠 News Intelligence Dashboard</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                padding: 30px;
                background-color: #f4f4f4;
                color: #333;
            }}
            h1 {{ color: #007acc; }}
            h2 {{ margin-top: 40px; }}
            .card {{
                background-color: #fff;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
        </style>
    </head>
    <body>
        <h1>🧠 News Intelligence Dashboard</h1>
        <p>Generado el {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

        <h2>📅 Calendario Económico</h2>
    """

    for event in events[:5]:
        html += f"""
        <div class="card">
            <strong>{event['title']}</strong><br>
            Fecha: {event['date']}<br>
            Impacto: <b>{event['impact']}</b>
        </div>
        """

    html += "<h2>📰 Noticias Relevantes</h2>"

    for item in news[:5]:
        html += f"""
        <div class="card">
            <strong>{item['headline']}</strong><br>
            Símbolo: {item['symbol']}<br>
            Fuente: {item['source']}
        </div>
        """

    html += "</body></html>"

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html)
    
    print(f"✅ Dashboard generado: {os.path.abspath(output_file)}")


# === Main Execution ===
analyzer = NewsAnalyzer(
    symbols=["BTC", "ETH", "PEPE"],
    keywords=["inflation", "FED", "ETF", "Binance", "crypto regulation", "Elon Musk", "Trump"]
)

print("🔍 Obteniendo eventos económicos y noticias...")
calendar_events = analyzer.get_calendar_events()
news_items = analyzer.search_news()

generate_html_report(calendar_events, news_items)