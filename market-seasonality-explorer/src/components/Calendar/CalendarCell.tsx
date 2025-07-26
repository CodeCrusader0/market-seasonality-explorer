// src/components/Calendar/CalendarCell.tsx
import React, { type KeyboardEvent, type TouchEvent } from "react";
import moment from "moment";
import { useIntraday } from "../../api/useIntraday";
import type { IntradayTick } from "../../data/types";
import type { MarketData } from "./Calendar";
import styles from "./Calendar.module.scss";

interface CalendarCellProps {
  date: moment.Moment;
  data?: MarketData;
  symbol: string; // your trading symbol
  volStd: number; // daily volatility
  ma?: number; // moving average
  maxVolume: number; // max volume in view
  today: string; // YYYY-MM-DD
  isInCurrentMonth: boolean;
  inRange: boolean; // selection range
  showVolatility: boolean;
  showVolume: boolean;
  showPerformance: boolean;
  showIntraday: boolean; // new
  hoverDate: moment.Moment | null;
  focusDate: moment.Moment | null;
  getVolColor: (s: number) => string;
  onSelectDate: (d: moment.Moment) => void;
  onHover: (d: moment.Moment | null) => void;
  onCellKeyDown: (e: KeyboardEvent<HTMLDivElement>, d: moment.Moment) => void;
  onIntradayHover: (date: string, rect: DOMRect) => void; // new
  onIntradayLeave: () => void; // new
}

const MAX_VOLUME_BARS = 10;

export default function CalendarCell({
  date,
  data: md,
  symbol,
  volStd,
  ma,
  maxVolume,
  today,
  isInCurrentMonth,
  inRange,
  showVolatility,
  showVolume,
  showPerformance,
  showIntraday,
  hoverDate,
  focusDate,
  getVolColor,
  onSelectDate,
  onHover,
  onCellKeyDown,
  onIntradayHover,
  onIntradayLeave,
}: CalendarCellProps) {
  // 1️⃣ Performance indicator
  const perf = md
    ? md.close > md.open
      ? "up"
      : md.close < md.open
      ? "down"
      : "neutral"
    : "neutral";

  // 2️⃣ Heatmap background
  const heatColor = md
    ? volStd < 0.01
      ? "rgba(72,187,120,0.15)"
      : volStd < 0.02
      ? "rgba(243,156,18,0.15)"
      : "rgba(192,57,43,0.15)"
    : "transparent";

  // 3️⃣ Weekly/Monthly volume bar width
  const barW = md && maxVolume > 0 ? (md.volume / maxVolume) * 80 : 0;

  const dateStr = date.format("YYYY-MM-DD");
  const ariaLabel = `${date.format("MMMM D, YYYY")}, Close ${
    md?.close.toFixed(2) ?? "N/A"
  }, Volatility ${volStd.toFixed(4)}`;

  // 4️⃣ Intraday hook (destructure its return!)
  useIntraday(symbol, dateStr, {
        enabled: showIntraday,
    });

  // 5️⃣ Hover handlers
  const handleMouseEnter = (e: React.MouseEvent) => {
    onHover(date);
    if (showIntraday) {
      onIntradayHover(dateStr, e.currentTarget.getBoundingClientRect());
    }
  };
  const handleMouseLeave = () => {
    onHover(null);
    if (showIntraday) onIntradayLeave();
  };

  const handleTouchStart = (_: TouchEvent) => onHover(date);
  const handleTouchEnd = (_: TouchEvent) => onHover(null);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={[
        styles.cell,
        !isInCurrentMonth ? styles.outside : "",
        inRange ? styles.inRange : "",
        dateStr === today ? styles.today : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: heatColor }}
      onClick={() => onSelectDate(date)}
      onKeyDown={(e) => onCellKeyDown(e, date)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Date label */}
      <span className={styles.dateLabel}>{date.date()}</span>

      {/* Intraday badge */}
      {showIntraday && <span className={styles.intradayBadge}>⚡</span>}

      {/* Tooltip */}
      {hoverDate?.isSame(date, "day") && (
        <div className={styles.tooltip}>
          <div>
            <strong>{date.format("MMM D, YYYY")}</strong>
          </div>
          <div>Open: {md?.open.toFixed(2) ?? "-"}</div>
          <div>Close: {md?.close.toFixed(2) ?? "-"}</div>
          {showVolume && (
            <div>Volume: {md?.volume.toLocaleString() ?? "-"}</div>
          )}
          {showVolatility && (
            <>
              <div>Volatility: {volStd.toFixed(4)}</div>
              <div>MA: {ma?.toFixed(2) ?? "-"}</div>
            </>
          )}
          {showPerformance && <div>Performance: {perf}</div>}
        </div>
      )}

      {/* Weekly/Monthly metrics */}
      {isInCurrentMonth && (
        <div className={styles.metricsColumn}>
          {showVolatility && (
            <div
              className={styles.volatilityDot}
              style={{ backgroundColor: getVolColor(volStd) }}
            />
          )}
          {showVolume && (
            <div className={styles.volumeBar} style={{ width: `${barW}px` }} />
          )}
          {showPerformance && (
            <div className={styles.performanceIcon}>
              {perf === "up" ? "▲" : perf === "down" ? "▼" : "▬"}
            </div>
          )}
        </div>
      )}

      {/* Intraday popup is rendered outside this component */}
    </div>
  );
}
