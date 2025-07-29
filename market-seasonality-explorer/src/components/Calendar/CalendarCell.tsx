import React, {
  type KeyboardEvent,
  type TouchEvent,
  useState,
  useEffect,
  useRef,
} from "react";
import moment from "moment";
import { useIntraday } from "../../api/useIntraday";
import type { MarketData } from "../../data/types";
import { motion } from "framer-motion";
import styles from "./Calendar.module.scss";

type CalendarCellProps = React.ComponentProps<typeof motion.div> & {
  date: moment.Moment;
  data?: MarketData;
  symbol: string;
  volStd: number;
  ma?: number;
  maxVolume: number;
  today: string;
  isInCurrentMonth: boolean;
  inRange: boolean;
  showVolatility: boolean;
  showVolume: boolean;
  showPerformance: boolean;
  showIntraday: boolean;
  hoverDate: moment.Moment | null;
  focusDate: moment.Moment | null;
  getVolColor: (s: number) => string;
  onSelectDate: (d: moment.Moment) => void;
  onHover: (d: moment.Moment | null) => void;
  onCellKeyDown: (e: KeyboardEvent<HTMLDivElement>, d: moment.Moment) => void;
  onIntradayHover: (date: string, rect: DOMRect) => void;
  onIntradayLeave: () => void;
  alerts: { volatility?: number; performance?: number; date: string }[];
};


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
  alerts,
  ...motionProps
}: CalendarCellProps) {
  const perf = md
    ? md.close > md.open
      ? "up"
      : md.close < md.open
      ? "down"
      : "neutral"
    : "neutral";

  const heatColor = md
    ? volStd < 0.01
      ? "rgba(72,187,120,0.15)"
      : volStd < 0.02
      ? "rgba(243,156,18,0.15)"
      : "rgba(192,57,43,0.15)"
    : "transparent";

  const barW = md && maxVolume > 0 ? (md.volume / maxVolume) * 80 : 0;

  const dateStr = date.format("YYYY-MM-DD");
  const priceChangePct = md
    ? (((md.close - md.open) / md.open) * 100).toFixed(2)
    : "N/A";
  const maDiff = md && ma ? (((md.close - ma) / ma) * 100).toFixed(2) : "N/A";
  const ariaLabel = `${date.format("MMMM D, YYYY")}, Close ${
    md?.close.toFixed(2) ?? "N/A"
  }, Volatility ${volStd.toFixed(4)}, Price Change ${priceChangePct}%`;

  useIntraday(symbol, dateStr, {
    enabled: showIntraday,
  });

  const cellRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<
    "top" | "bottom" | "left" | "right"
  >("top");

  useEffect(() => {
    if (!cellRef.current || !hoverDate?.isSame(date, "day")) return;
    const rect = cellRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceRight = viewportWidth - rect.right;

    if (spaceAbove > 100 && spaceAbove >= spaceBelow) {
      setTooltipPosition("top");
    } else if (spaceBelow > 100) {
      setTooltipPosition("bottom");
    } else if (spaceRight > 100) {
      setTooltipPosition("right");
    } else {
      setTooltipPosition("left");
    }
  }, [hoverDate, date]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    onHover(date);
    if (showIntraday) {
      onIntradayHover(dateStr, e.currentTarget.getBoundingClientRect());
    }
  };
  const handleMouseLeave = () => {
    onHover(null);
    if (showIntraday) onIntradayLeave();
  };

  const handleTouchStart = (_: TouchEvent<HTMLDivElement>) => onHover(date);
  const handleTouchEnd = (_: TouchEvent<HTMLDivElement>) => onHover(null);

  const hasAlert = alerts.some((alert) => alert.date === dateStr);
  const isAnomaly = volStd > 0.03;

  const cellVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.2 } },
  };

  const tooltipVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      ref={cellRef}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-describedby={
        hoverDate?.isSame(date, "day") ? `tooltip-${dateStr}` : undefined
      }
      className={[
        styles.cell,
        !isInCurrentMonth ? styles.outside : "",
        inRange ? styles.inRange : "",
        dateStr === today ? styles.today : "",
        isAnomaly ? styles.anomaly : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: heatColor }}
      onClick={() => onSelectDate(date)}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => onCellKeyDown(e, date)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      variants={cellVariants}
      initial="hidden"
      animate="visible"
      {...motionProps}
    >
      <span className={styles.dateLabel}>{date.date()}</span>
      {showIntraday && <span className={styles.intradayBadge}>⚡</span>}
      {hasAlert && <span className={styles.alertBadge}>!</span>}

      {hoverDate?.isSame(date, "day") && (
        <motion.div
          id={`tooltip-${dateStr}`}
          className={[styles.tooltip, styles[tooltipPosition]].join(" ")}
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
        >
          <div>
            <strong>{date.format("MMM D, YYYY")}</strong>
          </div>
          <div>Open: {md?.open.toFixed(2) ?? "-"}</div>
          <div>High: {md?.high.toFixed(2) ?? "-"}</div>
          <div>Low: {md?.low.toFixed(2) ?? "-"}</div>
          <div>Close: {md?.close.toFixed(2) ?? "-"}</div>
          <div>Price Change: {priceChangePct}%</div>
          {showVolume && (
            <div>Volume: {md?.volume.toLocaleString() ?? "-"}</div>
          )}
          {showVolatility && (
            <>
              <div>Volatility: {volStd.toFixed(4)}</div>
              <div>MA: {ma?.toFixed(2) ?? "-"}</div>
              <div>Close vs MA: {maDiff}%</div>
            </>
          )}
          {showPerformance && <div>Performance: {perf}</div>}
        </motion.div>
      )}

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
    </motion.div>
  );
}
