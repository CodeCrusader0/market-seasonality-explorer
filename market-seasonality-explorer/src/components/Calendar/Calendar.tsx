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
import styles from "./Calendar.module.scss";
import { saveAs } from "file-saver";

const VIEWS = ["Daily", "Weekly", "Monthly"] as const;
type ViewType = (typeof VIEWS)[number];

interface MarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface WeekSummary {
  weekStart: string;
  avgVolatility: number;
  totalVolume: number;
  avgClose: number;
}

function getWeekSummary(
  days: moment.Moment[],
  cd: Record<string, MarketData>,
  vm: Record<string, number>
): WeekSummary {
  const valid = days.filter((d) => cd[d.format("YYYY-MM-DD")]);
  const avgVol =
    valid.reduce((sum, d) => sum + (vm[d.format("YYYY-MM-DD")] || 0), 0) /
    valid.length;
  const totVol = valid.reduce(
    (sum, d) => sum + cd[d.format("YYYY-MM-DD")].volume,
    0
  );
  const avgClose =
    valid.reduce((sum, d) => sum + cd[d.format("YYYY-MM-DD")].close, 0) /
    valid.length;
  return {
    weekStart: days[0].format("MMM D"),
    avgVolatility: avgVol,
    totalVolume: totVol,
    avgClose,
  };
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

  // Fetch data + rolling stats
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

        const windowSize = 5;
        const vol: Record<string, number> = {};
        const ma: Record<string, number> = {};
        for (let i = windowSize - 1; i < arr.length; i++) {
          const slice = arr.slice(i - windowSize + 1, i + 1);
          const rets = slice.map((d) => (d.close - d.open) / d.open);
          const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
          vol[slice[windowSize - 1].date] = Math.sqrt(
            rets.map((r) => (r - mean) ** 2).reduce((a, b) => a + b, 0) /
              rets.length
          );
          ma[slice[windowSize - 1].date] =
            slice.reduce((sum, d) => sum + d.close, 0) / windowSize;
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

  const renderCell = (date: moment.Moment) => {
    const ds = date.format("YYYY-MM-DD");
    const md = calendarData[ds];
    const volStd = volatilityMap[ds] ?? 0;
    const perf = md
      ? md.close > md.open
        ? "up"
        : md.close < md.open
        ? "down"
        : "neutral"
      : "neutral";

    const thisMonth = date.month() === currentMonth.month();
    const heatColor = md
      ? volStd < 0.01
        ? "rgba(72,187,120,0.15)"
        : volStd < 0.02
        ? "rgba(243,156,18,0.15)"
        : "rgba(192,57,43,0.15)"
      : "transparent";

    const barW = md && maxVolume > 0 ? (md.volume / maxVolume) * 80 : 0;
    const ariaLabel = `${date.format("MMMM D, YYYY")}, Close ${
      md?.close.toFixed(2) ?? "N/A"
    }, Volatility ${volStd.toFixed(4)}`;

    const onTouchStart = (_: TouchEvent) => setHoverDate(date);
    const onTouchEnd = (_: TouchEvent) => setHoverDate(null);

    return (
      <div
        key={ds}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        className={`${styles.cell} ${!thisMonth ? styles.outside : ""}`}
        style={{ backgroundColor: heatColor }}
        onClick={() => handleSelectDate(date)}
        onKeyDown={(e) => onCellKeyDown(e, date)}
        onMouseEnter={() => setHoverDate(date)}
        onMouseLeave={() => setHoverDate(null)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onFocus={() => setFocusDate(date)}
      >
        <span className={styles.dateLabel}>{date.date()}</span>

        {hoverDate?.isSame(date, "day") && (
          <div className={styles.tooltip}>
            <div>
              <strong>{date.format("MMM D, YYYY")}</strong>
            </div>
            <div>Open: {md?.open.toFixed(2) ?? "-"}</div>
            <div>Close: {md?.close.toFixed(2) ?? "-"}</div>
            {showVolume && (
              <div>Volume: {md ? md.volume.toLocaleString() : "-"}</div>
            )}
            {showVolatility && (
              <>
                <div>Volatility: {volStd.toFixed(4)}</div>
                <div>MA: {maMap[ds]?.toFixed(2) ?? "-"}</div>
              </>
            )}
            {showPerformance && <div>Performance: {perf}</div>}
          </div>
        )}

        {thisMonth && (
          <div className={styles.metricsColumn}>
            {showVolatility && (
              <div
                className={styles.volatilityDot}
                style={{ backgroundColor: getVolColor(volStd) }}
              />
            )}
            {showVolume && (
              <div
                className={styles.volumeBar}
                style={{ width: `${barW}px` }}
              />
            )}
            {showPerformance && (
              <div className={styles.performanceIcon}>
                {perf === "up" ? "▲" : perf === "down" ? "▼" : "▬"}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGrid = () => {
    if (view === "Daily") {
      const weekdayIndex = currentMonth.day();
      return (
        <div className={styles.weekRow}>
          {Array(7)
            .fill(null)
            .map((_, idx) =>
              idx === weekdayIndex ? (
                renderCell(currentMonth)
              ) : (
                <div key={idx} className={styles.emptyCell} />
              )
            )}
        </div>
      );
    }

    if (view === "Weekly") {
      const wk = currentMonth.clone().startOf("week");
      return (
        <div className={styles.weekRow}>
          {Array(7)
            .fill(null)
            .map((_, i) => renderCell(wk.clone().add(i, "day")))}
        </div>
      );
    }

    // Monthly
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
    return weeks.map((week, idx) => {
      const summary = getWeekSummary(week, calendarData, volatilityMap);
      return (
        <div key={idx} className={styles.weekContainer}>
          <div className={styles.weekSummaryRow}>
            <span>Week of {summary.weekStart}</span>
            <span>Avg Vol: {summary.avgVolatility.toFixed(4)}</span>
            <span>Tot Vol: {summary.totalVolume.toLocaleString()}</span>
            <span>Avg Close: {summary.avgClose.toFixed(2)}</span>
          </div>
          <div className={styles.weekRow}>{week.map(renderCell)}</div>
        </div>
      );
    });
  };

  const exportToCSV = () => {
    if (!rangeStart || !rangeEnd) return;
    let csv = "Date,Open,High,Low,Close,Volume,Volatility,MA\n";
    let d = rangeStart.clone();
    while (d.isSameOrBefore(rangeEnd, "day")) {
      const ds = d.format("YYYY-MM-DD");
      const md = calendarData[ds];
      const vol = volatilityMap[ds] ?? 0;
      const ma = maMap[ds] ?? 0;
      if (md) {
        csv += `${ds},${md.open},${md.high},${md.low},${md.close},${
          md.volume
        },${vol.toFixed(4)},${ma.toFixed(2)}\n`;
      }
      d.add(1, "day");
    }
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      "market_data.csv"
    );
  };

  const exportToPNG = () => {
    if (!calendarRef.current) return;
    import("html-to-image")
      .then((htmlToImage) =>
        htmlToImage.toPng(calendarRef.current!).then((url) => {
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
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() =>
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
        >
          ◀
        </button>
        <h2>
          {view === "Monthly"
            ? currentMonth.format("MMMM YYYY")
            : view === "Weekly"
            ? `Week of ${currentMonth.format("MMM D, YYYY")}`
            : currentMonth.format("dddd, MMM D")}
        </h2>
        <button
          onClick={() =>
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
        >
          ▶
        </button>
        <select
          onChange={(e) => setView(e.target.value as ViewType)}
          value={view}
        >
          {VIEWS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select onChange={(e) => setSymbol(e.target.value)} value={symbol}>
          <option value="BTCUSDT">BTC</option>
          <option value="ETHUSDT">ETH</option>
          <option value="BNBUSDT">BNB</option>
        </select>
      </div>

      {/* Filters & Selection */}
      <div className={styles.filters}>
        <label>
          <input
            type="checkbox"
            checked={showVolatility}
            onChange={() => setShowVolatility((v) => !v)}
          />{" "}
          Volatility
        </label>
        <label>
          <input
            type="checkbox"
            checked={showVolume}
            onChange={() => setShowVolume((v) => !v)}
          />{" "}
          Volume
        </label>
        <label>
          <input
            type="checkbox"
            checked={showPerformance}
            onChange={() => setShowPerformance((v) => !v)}
          />{" "}
          Performance
        </label>
      </div>
      {rangeStart && rangeEnd && (
        <div className={styles.selectionInfo}>
          Selected: {rangeStart.format("MMM D")} – {rangeEnd.format("MMM D")}
        </div>
      )}

      {/* Day Labels */}
      <div className={styles.dayLabels}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div
        ref={calendarRef}
        className={`${styles.grid} ${styles[`transition-${view}`]}`}
      >
        {renderGrid()}
      </div>

      {/* Exports */}
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
