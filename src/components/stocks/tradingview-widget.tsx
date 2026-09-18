"use client";

import { useEffect, useRef } from "react";

type Widget = "advanced-chart" | "financials" | "technical-analysis";

const SCRIPT: Record<Widget, string> = {
  "advanced-chart": "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
  financials: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
  "technical-analysis": "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
};

interface TradingViewWidgetProps {
  widget: Widget;
  symbol: string; // exchange-qualified, e.g. NASDAQ:AAPL
  height?: number;
  className?: string;
}

export function TradingViewWidget({ widget, symbol, height = 500, className }: TradingViewWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = "";

    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    inner.style.width = "100%";
    container.appendChild(inner);

    const script = document.createElement("script");
    script.src = SCRIPT[widget];
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify(config(widget, symbol, height));
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [widget, symbol, height]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ height, width: "100%" }}
      role="img"
      aria-label={`TradingView ${widget.replace("-", " ")} for ${symbol}`}
    />
  );
}

function config(widget: Widget, symbol: string, height: number) {
  const common = { symbol, locale: "en", colorTheme: "dark", isTransparent: true, width: "100%", height };
  switch (widget) {
    case "advanced-chart":
      return {
        autosize: true,
        symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        backgroundColor: "rgba(0, 0, 0, 0)",
        gridColor: "rgba(255, 255, 255, 0.06)",
        allow_symbol_change: false,
        hide_side_toolbar: true,
        calendar: false,
        support_host: "https://www.tradingview.com",
      };
    case "financials":
      return { ...common, displayMode: "regular", largeChartUrl: "" };
    case "technical-analysis":
      return { ...common, interval: "1D", showIntervalTabs: true, displayMode: "single" };
  }
}
