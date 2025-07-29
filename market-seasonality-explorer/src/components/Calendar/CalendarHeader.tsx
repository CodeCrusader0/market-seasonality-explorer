import moment from "moment";
import styles from "./Calendar.module.scss";
import { VIEWS, type ViewType } from "./Calendar";

interface CalendarHeaderProps {
  view: ViewType;
  currentMonth: moment.Moment;
  symbol: string;
  onPrev: () => void;
  onNext: () => void;
  onViewChange: (v: ViewType) => void;
  onSymbolChange: (s: string) => void;
}

export default function CalendarHeader({
  view,
  currentMonth,
  symbol,
  onPrev,
  onNext,
  onViewChange,
  onSymbolChange,
}: CalendarHeaderProps) {
  return (
    <div className={styles.header}>
      <button onClick={onPrev}>◀</button>
      <h2>
        {view === "Monthly"
          ? currentMonth.format("MMMM YYYY")
          : view === "Weekly"
          ? `Week of ${currentMonth.format("MMM D, YYYY")}`
          : currentMonth.format("dddd, MMM D")}
      </h2>
      <button onClick={onNext}>▶</button>
      <select
        value={view}
        onChange={(e) => onViewChange(e.target.value as ViewType)}
      >
        {VIEWS.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <select value={symbol} onChange={(e) => onSymbolChange(e.target.value)}>
        <option value="BTCUSDT">BTC</option>
        <option value="ETHUSDT">ETH</option>
        <option value="BNBUSDT">BNB</option>
      </select>
    </div>
  );
}
