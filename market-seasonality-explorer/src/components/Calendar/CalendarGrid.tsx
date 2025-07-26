// src/components/Calendar/CalendarGrid.tsx
import React from "react";
import moment from "moment";

import CalendarCell from "./CalendarCell";
import WeeklySummary from "./WeeklySummary";
import type { MarketData, ViewType } from "./Calendar";
import styles from "./Calendar.module.scss";

interface CalendarGridProps {
  view: ViewType;
  currentMonth: moment.Moment;
  calendarData: Record<string, MarketData>;
  volatilityMap: Record<string, number>;
  maMap: Record<string, number>;
  maxVolume: number;
  today: string;
  rangeStart: moment.Moment | null;
  rangeEnd: moment.Moment | null;
  hoverDate: moment.Moment | null;
  focusDate: moment.Moment | null;
  inRange: (d: moment.Moment) => boolean;
  getVolColor: (s: number) => string;
  onSelectDate: (d: moment.Moment) => void;
  onHover: (d: moment.Moment | null) => void;
  onCellKeyDown: (
    e: React.KeyboardEvent<HTMLDivElement>,
    d: moment.Moment
  ) => void;

  showVolatility: boolean;
  showVolume: boolean;
  showPerformance: boolean;
  showIntraday: boolean; // new
  onIntradayHover: (date: string, rect: DOMRect) => void; // new
  onIntradayLeave: () => void; // new

  symbol: string; // new
}

export default function CalendarGrid({
  view,
  currentMonth,
  calendarData,
  volatilityMap,
  maMap,
  maxVolume,
  today,
  rangeStart,
  rangeEnd,
  hoverDate,
  focusDate,
  inRange,
  getVolColor,
  onSelectDate,
  onHover,
  onCellKeyDown,

  showVolatility,
  showVolume,
  showPerformance,
  showIntraday, // destructured
  onIntradayHover, // destructured
  onIntradayLeave, // destructured

  symbol, // destructured
}: CalendarGridProps) {
  // ── Daily view ───────────────────────────────────────────────────────────────
  if (view === "Daily") {
    const weekdayIndex = currentMonth.day();
    return (
      <div className={styles.weekRow}>
        {Array(7)
          .fill(null)
          .map((_, idx) =>
            idx === weekdayIndex ? (
              <CalendarCell
                key={idx}
                date={currentMonth}
                data={calendarData[currentMonth.format("YYYY-MM-DD")]}
                symbol={symbol}
                volStd={volatilityMap[currentMonth.format("YYYY-MM-DD")] ?? 0}
                ma={maMap[currentMonth.format("YYYY-MM-DD")]}
                maxVolume={maxVolume}
                today={today}
                isInCurrentMonth
                inRange={inRange(currentMonth)}
                showVolatility={showVolatility}
                showVolume={showVolume}
                showPerformance={showPerformance}
                showIntraday={showIntraday}
                hoverDate={hoverDate}
                focusDate={focusDate}
                getVolColor={getVolColor}
                onSelectDate={onSelectDate}
                onHover={onHover}
                onCellKeyDown={onCellKeyDown}
                onIntradayHover={onIntradayHover}
                onIntradayLeave={onIntradayLeave}
              />
            ) : (
              <div key={idx} className={styles.emptyCell} />
            )
          )}
      </div>
    );
  }

  // ── Weekly view ──────────────────────────────────────────────────────────────
  if (view === "Weekly") {
    const wkStart = currentMonth.clone().startOf("week");
    return (
      <div className={styles.weekRow}>
        {Array(7)
          .fill(null)
          .map((_, i) => {
            const d = wkStart.clone().add(i, "day");
            return (
              <CalendarCell
                key={d.format("YYYY-MM-DD")}
                date={d}
                data={calendarData[d.format("YYYY-MM-DD")]}
                symbol={symbol}
                volStd={volatilityMap[d.format("YYYY-MM-DD")] ?? 0}
                ma={maMap[d.format("YYYY-MM-DD")]}
                maxVolume={maxVolume}
                today={today}
                isInCurrentMonth={d.month() === currentMonth.month()}
                inRange={inRange(d)}
                showVolatility={showVolatility}
                showVolume={showVolume}
                showPerformance={showPerformance}
                showIntraday={showIntraday}
                hoverDate={hoverDate}
                focusDate={focusDate}
                getVolColor={getVolColor}
                onSelectDate={onSelectDate}
                onHover={onHover}
                onCellKeyDown={onCellKeyDown}
                onIntradayHover={onIntradayHover}
                onIntradayLeave={onIntradayLeave}
              />
            );
          })}
      </div>
    );
  }

  // ── Monthly view ─────────────────────────────────────────────────────────────
  const start = currentMonth.clone().startOf("month").startOf("week");
  const end = currentMonth.clone().endOf("month").endOf("week");
  let day = start.clone().subtract(1, "day");
  const weeks: moment.Moment[][] = [];
  while (day.isBefore(end, "day")) {
    weeks.push(
      Array(7)
        .fill(null)
        .map(() => day.add(1, "day").clone())
    );
  }

  return (
    <>
      {weeks.map((week, idx) => {
        // compute weekly summary
        const validDays = week.filter(
          (d) => calendarData[d.format("YYYY-MM-DD")]
        );
        const avgVol =
          validDays.reduce(
            (sum, d) => sum + (volatilityMap[d.format("YYYY-MM-DD")] || 0),
            0
          ) / validDays.length;
        const totVol = validDays.reduce(
          (sum, d) => sum + calendarData[d.format("YYYY-MM-DD")].volume,
          0
        );
        const avgClose =
          validDays.reduce(
            (sum, d) => sum + calendarData[d.format("YYYY-MM-DD")].close,
            0
          ) / validDays.length;
        const summary = {
          weekStart: week[0].format("MMM D"),
          avgVolatility: avgVol,
          totalVolume: totVol,
          avgClose,
        };

        return (
          <div key={idx}>
            <WeeklySummary summary={summary} />
            <div className={styles.weekRow}>
              {week.map((d) => (
                <CalendarCell
                  key={d.format("YYYY-MM-DD")}
                  date={d}
                  data={calendarData[d.format("YYYY-MM-DD")]}
                  symbol={symbol}
                  volStd={volatilityMap[d.format("YYYY-MM-DD")] ?? 0}
                  ma={maMap[d.format("YYYY-MM-DD")]}
                  maxVolume={maxVolume}
                  today={today}
                  isInCurrentMonth={d.month() === currentMonth.month()}
                  inRange={inRange(d)}
                  showVolatility={showVolatility}
                  showVolume={showVolume}
                  showPerformance={showPerformance}
                  showIntraday={showIntraday}
                  hoverDate={hoverDate}
                  focusDate={focusDate}
                  getVolColor={getVolColor}
                  onSelectDate={onSelectDate}
                  onHover={onHover}
                  onCellKeyDown={onCellKeyDown}
                  onIntradayHover={onIntradayHover}
                  onIntradayLeave={onIntradayLeave}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
