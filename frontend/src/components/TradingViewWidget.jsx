import React, { useEffect, useRef, memo } from 'react';

const TradingViewWidget = memo(({ symbol = "BTCUSDT", interval = "15m", theme = "dark" }) => {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": `BINANCE:${symbol}`,
      "interval": interval,
      "timezone": "Etc/UTC",
      "theme": theme,
      "style": "1",
      "locale": "es",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "support_host": "https://www.tradingview.com",
      "container_id": "tradingview_advanced_chart",
      "studies": [
        "Volume@tv-basicstudies"
      ],
      "show_popup_button": true,
      "popup_width": "1000",
      "popup_height": "650",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "backgroundColor": "rgba(19, 23, 34, 1)",
      "gridColor": "rgba(42, 46, 57, 0.5)",
      "hide_volume": false,
      "withdateranges": true,
      "range": "12M",
      "details": true,
      "hotlist": true,
      "calendar": true,
      "studies_overrides": {
        "volume.volume.color.0": "rgba(47, 158, 68, 0.7)",
        "volume.volume.color.1": "rgba(239, 83, 80, 0.7)"
      }
    });

    if (container.current) {
      container.current.innerHTML = '';
      container.current.appendChild(script);
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme]);

  return (
    <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
      <div id="tradingview_advanced_chart" ref={container} style={{ height: "calc(100% - 32px)", width: "100%" }}>
        <div className="tradingview-widget-copyright">
          <a href={`https://www.tradingview.com/symbols/${symbol}/`} rel="noopener nofollow" target="_blank">
            <span className="blue-text">{symbol} Chart</span>
          </a> by TradingView
        </div>
      </div>
    </div>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;