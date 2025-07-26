import React from "react";
import styles from "./Calendar.module.scss";

export default function DayLabels() {
  return (
    <div className={styles.dayLabels}>
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d}>{d}</div>
      ))}
    </div>
  );
}
