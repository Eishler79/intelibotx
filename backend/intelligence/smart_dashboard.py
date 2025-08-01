# smart_dashboard.py

from typing import Dict
from rich.console import Console
from rich.table import Table
from rich.panel import Panel 

console = Console()

def display_signal_summary(signals: Dict[str, str], title: str = "Resumen de Indicadores Técnicos"):
    table = Table(title=title)
    table.add_column("Indicador", style="cyan", no_wrap=True)
    table.add_column("Interpretación", style="magenta")

    for indicator, interpretation in signals.items():
        table.add_row(indicator, interpretation)

    console.print(table)

def display_candlestick_pattern(pattern: str, signal: str):
    console.print(f"\n[bold yellow]🕯️ Patrón de Vela Detectado:[/bold yellow] [green]{pattern}[/green]", justify="left")
    console.print(f"[bold cyan]📈 Señal técnica:[/bold cyan] [white]{signal}[/white]\n", justify="left")

def display_fundamental_news(news_list: list):
    console = Console()
    if not news_list:
        console.print("[bold yellow]No se encontraron noticias relevantes.[/bold yellow]")
        return

    for news in news_list:
        headline = news.get("headline", "Sin titular")
        source = news.get("source", "Fuente desconocida")
        console.print(f"[bold blue]📰 Noticia relevante:[/bold blue] {headline} (Fuente: {source})")

def display_decision_summary(decision: dict):
    """
    Muestra un resumen táctico final con acción sugerida, score y razones.
    """
    table = Table(title="🔍 Evaluación Táctica Final", show_lines=True)
    table.add_column("Acción", style="bold cyan", justify="center")
    table.add_column("Score", justify="center")
    table.add_column("Razones Principales", style="green")

    action = decision.get("action", "N/A").upper()
    score = str(decision.get("score", 0))
    components = decision.get("score_components", [])
    reasons = "\n".join([f"✅ {label}" for label, value in components if value])

    table.add_row(action, score, reasons or "No se detectaron razones claras")

    console.print(table)
    console.print(Panel(f"[bold yellow]Motivo General:[/bold yellow] {decision.get('reason', 'Sin motivo especificado')}"))