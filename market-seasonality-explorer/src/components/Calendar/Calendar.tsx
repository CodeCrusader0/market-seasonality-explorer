import React, {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type TouchEvent,
} from "react";
import moment from "moment";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";

import CalendarHeader from "./CalendarHeader";
import CalendarFilters from "./CalendarFilters";
import DayLabels from "./DayLabels";
import CalendarGrid from "./CalendarGrid";
import IntradayDetail from "./IntradayDetail";

import styles from "./Calendar.module.scss";

export const VIEWS = ["Daily", "Weekly", "Monthly"] as const;
export type ViewType = (typeof VIEWS)[number];

export interface MarketData {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface WeekSummary {
  weekStart: string;
  avgVolatility: number;
  totalVolume: number;
  avgClose: number;
}

export default function Calendar({
  symbol,
  setSymbol,
}: {
  symbol: string;
  setSymbol: (s: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [view, setView] = useState<ViewType>("Monthly");
  const [rangeStart, setRangeStart] = useState<moment.Moment | null>(null);
  const [rangeEnd, setRangeEnd] = useState<moment.Moment | null>(null);
  const [hoverDate, setHoverDate] = useState<moment.Moment | null>(null);
  const [focusDate, setFocusDate] = useState<moment.Moment | null>(null);

  // NEW: intraday toggle & hover state
  const [showIntraday, setShowIntraday] = useState(false);
  const [intradayHover, setIntradayHover] = useState<{
    date: string;
    rect: DOMRect;
  } | null>(null);

  const [showVolatility, setShowVolatility] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showPerformance, setShowPerformance] = useState(true);

  const [calendarData, setCalendarData] = useState<Record<string, MarketData>>(
    {}
  );
  const [volatilityMap, setVolatilityMap] = useState<Record<string, number>>(
    {}
  );
  const [maMap, setMaMap] = useState<Record<string, number>>({});
  const [maxVolume, setMaxVolume] = useState(0);

  const navigate = useNavigate();
  const today = moment().format("YYYY-MM-DD");
  const calendarRef = useRef<HTMLDivElement>(null);

  // fetch daily OHLCV
  useEffect(() => {
    (async () => {
      const start = currentMonth.clone().startOf("month").startOf("week");
      const end = currentMonth.clone().endOf("month").endOf("week");
      try {
        const res = await axios.get("https://api.binance.com/api/v3/klines", {
          params: {
            symbol,
            interval: "1d",
            startTime: start.valueOf(),
            endTime: end.valueOf(),
          },
        });
        const arr: MarketData[] = res.data.map((d: any) => ({
          symbol,
          date: new Date(d[0]).toISOString().split("T")[0],
          open: +d[1],
          high: +d[2],
          low: +d[3],
          close: +d[4],
          volume: +d[5],
        }));
        const map: Record<string, MarketData> = {};
        arr.forEach((m) => (map[m.date] = m));
        setCalendarData(map);
        setMaxVolume(Math.max(...arr.map((m) => m.volume), 0));

        // compute volatility & MA
        const windowSize = 5;
        const vol: Record<string, number> = {};
        const ma: Record<string, number> = {};
        for (let i = windowSize - 1; i < arr.length; i++) {
          const slice = arr.slice(i - windowSize + 1, i + 1);
          const rets = slice.map((d) => (d.close - d.open) / d.open);
          const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
          vol[slice[windowSize - 1].date] = Math.sqrt(
            rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length
          );
          ma[slice[windowSize - 1].date] =
            slice.reduce((s, d) => s + d.close, 0) / windowSize;
        }
        setVolatilityMap(vol);
        setMaMap(ma);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [currentMonth, symbol]);

  const getVolColor = (s: number) =>
    s < 0.01 ? "green" : s < 0.02 ? "orange" : "red";

  const inRange = (d: moment.Moment) =>
    !!rangeStart &&
    !!rangeEnd &&
    d.isSameOrAfter(rangeStart, "day") &&
    d.isSameOrBefore(rangeEnd, "day");

  const handleSelectDate = (d: moment.Moment) => {
    if (!rangeStart) setRangeStart(d);
    else if (!rangeEnd) {
      if (d.isBefore(rangeStart)) {
        setRangeEnd(rangeStart);
        setRangeStart(d);
      } else setRangeEnd(d);
    } else {
      setRangeStart(d);
      setRangeEnd(null);
    }
  };

  const moveFocus = (dir: "left" | "right" | "up" | "down") => {
    if (!focusDate) {
      setFocusDate(moment());
      return;
    }
    let next = focusDate.clone();
    if (dir === "left") next.subtract(1, "day");
    if (dir === "right") next.add(1, "day");
    if (dir === "up") next.subtract(7, "day");
    if (dir === "down") next.add(7, "day");
    setFocusDate(next);
  };

  const onCellKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    date: moment.Moment
  ) => {
    if (e.key === "Enter") handleSelectDate(date);
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      moveFocus(e.key.replace("Arrow", "").toLowerCase() as any);
    }
  };

  const exportToCSV = () => {
    if (!rangeStart || !rangeEnd) return;
    let csv = "Date,Open,High,Low,Close,Volume,Volatility,MA\n";
    let d = rangeStart.clone();
    while (d.isSameOrBefore(rangeEnd, "day")) {
      const ds = d.format("YYYY-MM-DD");
      const md = calendarData[ds];
      const vol = volatilityMap[ds] ?? 0;
      const mavg = maMap[ds] ?? 0;
      if (md) {
        csv += `${ds},${md.open},${md.high},${md.low},${md.close},${
          md.volume
        },${vol.toFixed(4)},${mavg.toFixed(2)}\n`;
      }
      d.add(1, "day");
    }
    saveAs(new Blob([csv], { type: "text/csv" }), "market_data.csv");
  };

  const exportToPNG = () => {
    if (!calendarRef.current) return;
    import("html-to-image")
      .then((h) =>
        h.toPng(calendarRef.current!).then((url: string) => {
          const a = document.createElement("a");
          a.download = "calendar.png";
          a.href = url;
          a.click();
        })
      )
      .catch(() => alert("Export failed"));
  };

  return (
    <div className={styles.calendarWrapper}>
      <CalendarHeader
        view={view}
        currentMonth={currentMonth}
        symbol={symbol}
        onPrev={() =>
          setCurrentMonth((p) =>
            p
              .clone()
              .subtract(
                1,
                view === "Monthly"
                  ? "month"
                  : view === "Weekly"
                  ? "week"
                  : "day"
              )
          )
        }
        onNext={() =>
          setCurrentMonth((p) =>
            p
              .clone()
              .add(
                1,
                view === "Monthly"
                  ? "month"
                  : view === "Weekly"
                  ? "week"
                  : "day"
              )
          )
        }
        onViewChange={setView}
        onSymbolChange={setSymbol}
      />

      <CalendarFilters
        showVolatility={showVolatility}
        showVolume={showVolume}
        showPerformance={showPerformance}
        showIntraday={showIntraday} // ← new
        toggleVolatility={() => setShowVolatility((v) => !v)}
        toggleVolume={() => setShowVolume((v) => !v)}
        togglePerformance={() => setShowPerformance((v) => !v)}
        toggleIntraday={() => setShowIntraday((v) => !v)} // ← new
      />

      {rangeStart && rangeEnd && (
        <div className={styles.selectionInfo}>
          Selected: {rangeStart.format("MMM D")} – {rangeEnd.format("MMM D")}
        </div>
      )}

      <DayLabels />

      <div
        ref={calendarRef}
        className={`${styles.grid} ${styles[`transition-${view}`]}`}
      >
        <CalendarGrid
          view={view}
          currentMonth={currentMonth}
          calendarData={calendarData}
          symbol={symbol}
          volatilityMap={volatilityMap}
          maMap={maMap}
          maxVolume={maxVolume}
          today={today}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          hoverDate={hoverDate}
          focusDate={focusDate}
          inRange={inRange}
          getVolColor={getVolColor}
          onSelectDate={handleSelectDate}
          onHover={setHoverDate}
          onCellKeyDown={onCellKeyDown}
          showVolatility={showVolatility}
          showVolume={showVolume}
          showPerformance={showPerformance}
          showIntraday={showIntraday} // ← pass intraday flag
          onIntradayHover={(date, rect) => setIntradayHover({ date, rect })}
          onIntradayLeave={() => setIntradayHover(null)}
        />
      </div>

      {intradayHover && (
        <IntradayDetail
          symbol={symbol}
          date={intradayHover.date}
          anchorRect={intradayHover.rect}
        />
      )}

      {rangeStart && rangeEnd && (
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() =>
              navigate(
                `/dashboard/${rangeStart.format(
                  "YYYY-MM-DD"
                )}?end=${rangeEnd.format("YYYY-MM-DD")}`
              )
            }
          >
            Zoom In ({rangeStart.format("MMM D")}–{rangeEnd.format("MMM D")})
          </button>
          <button onClick={exportToCSV} style={{ marginLeft: 8 }}>
            Export CSV
          </button>
          <button onClick={exportToPNG} style={{ marginLeft: 8 }}>
            Export PNG
          </button>
        </div>
      )}

      {rangeStart && !rangeEnd && (
        <div style={{ marginTop: "0.5rem" }}>
          <button
            onClick={() => {
              setRangeStart(null);
              setRangeEnd(null);
            }}
          >
            Clear Range
          </button>
        </div>
      )}
    </div>
  );
}
