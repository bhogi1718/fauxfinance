"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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

    // TradingView's loader locates its container via document.currentScript, so a
    // script that gets detached before it finishes loading throws and the widget
    // never initializes. Deferring by a tick means React StrictMode's
    // mount/unmount/mount in dev results in exactly one inserted script.
    const timer = window.setTimeout(() => {
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
      script.text = JSON.stringify(config(widget, symbol, height));
      container.appendChild(script);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      container.innerHTML = "";
    };
  }, [widget, symbol, height]);

  return (
    // The loader rewrites the inner container's height to a percentage, so the
    // fixed pixel height must live on this outer wrapper.
    <div className={cn("w-full", className)} style={{ height }} role="img" aria-label={`TradingView ${widget.replace("-", " ")} for ${symbol}`}>
      <div ref={ref} className="tradingview-widget-container" style={{ height: "100%", width: "100%" }} />
    </div>
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
