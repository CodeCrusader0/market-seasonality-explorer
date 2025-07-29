import React from "react";
import moment from "moment";
import CalendarCell from "./CalendarCell";
import WeeklySummary from "./WeeklySummary";
import MonthlySummary from "./MonthlySummary";
import type { ViewType } from "./Calendar";
import styles from "./Calendar.module.scss";
import type { MarketData } from "../../data/types";

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
  showIntraday: boolean;
  onIntradayHover: (date: string, rect: DOMRect) => void;
  onIntradayLeave: () => void;
  symbol: string;
  alerts: { volatility?: number; performance?: number; date: string }[];
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
  showIntraday,
  onIntradayHover,
  onIntradayLeave,
  symbol,
  alerts,
}: CalendarGridProps) {
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
                alerts={alerts}
              />
            ) : (
              <div key={idx} className={styles.emptyCell} />
            )
          )}
      </div>
    );
  }

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
                alerts={alerts}
              />
            );
          })}
      </div>
    );
  }

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

  const validDays = Object.keys(calendarData).filter(
    (d) => moment(d).month() === currentMonth.month()
  );
  const avgVol =
    validDays.reduce((sum, d) => sum + (volatilityMap[d] || 0), 0) /
    (validDays.length || 1);
  const totVol = validDays.reduce((sum, d) => sum + calendarData[d].volume, 0);
  const avgClose =
    validDays.reduce((sum, d) => sum + calendarData[d].close, 0) /
    (validDays.length || 1);
  const firstDay = validDays[0] ? calendarData[validDays[0]] : null;
  const lastDay = validDays[validDays.length - 1]
    ? calendarData[validDays[validDays.length - 1]]
    : null;
  const performance =
    firstDay && lastDay
      ? ((lastDay.close - firstDay.open) / firstDay.open) * 100
      : 0;
  const monthlySummary = {
    month: currentMonth.format("MMMM YYYY"),
    avgVolatility: avgVol,
    totalVolume: totVol,
    avgClose,
    performance,
  };

  return (
    <>
      <MonthlySummary summary={monthlySummary} />
      {weeks.map((week, idx) => {
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
                  alerts={alerts}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
