import React from "react";
import type { WeekSummary as WeekSummaryType } from "./Calendar";
import styles from "./Calendar.module.scss";

interface WeeklySummaryProps {
  summary: WeekSummaryType;
}

export default function WeeklySummary({ summary }: WeeklySummaryProps) {
  return (
    <div className={styles.weekSummaryRow}>
      <span>Week of {summary.weekStart}</span>
      <span>Avg Vol: {summary.avgVolatility.toFixed(4)}</span>
      <span>Tot Vol: {summary.totalVolume.toLocaleString()}</span>
      <span>Avg Close: {summary.avgClose.toFixed(2)}</span>
    </div>
  );
}
