import React from "react";
import { useIntraday } from "../../api/useIntraday";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./Calendar.module.scss";

interface IntradayDetailProps {
  symbol: string;
  date: string; // "YYYY-MM-DD"
  anchorRect: DOMRect;
}

export default function IntradayDetail({
  symbol,
  date,
  anchorRect,
}: IntradayDetailProps) {
  const { data: ticks = [], isLoading } = useIntraday(symbol, date, {
    enabled: true,
  });

  // Prepare data for the charts
  const chartData = ticks.map((t) => ({
    time: t.time.slice(11, 16),
    mid: (t.high + t.low) / 2,
    volume: t.volume,
  }));

  // *** Make sure we return the JSX below ***
  return (
    <div
      className={styles.intradayPopup}
      style={{
        position: "absolute",
        top: anchorRect.bottom + window.scrollY + 4,
        left: anchorRect.left + window.scrollX,
        background: "#fff",
        border: "1px solid #ccc",
        padding: "0.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 2000,
      }}
    >
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <h4 style={{ margin: "0 0 0.5rem 0" }}>Intraday {date}</h4>
          <ResponsiveContainer width={250} height={100}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={false} />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="mid"
                stroke="#8884d8"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <ResponsiveContainer width={250} height={60}>
            <BarChart data={chartData}>
              <XAxis dataKey="time" tick={false} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="volume" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
