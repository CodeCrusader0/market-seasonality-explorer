import React from "react";

interface CalendarFiltersProps {
  showVolatility: boolean;
  showVolume: boolean;
  showPerformance: boolean;
  showIntraday: boolean; // ← new
  toggleVolatility: () => void;
  toggleVolume: () => void;
  togglePerformance: () => void;
  toggleIntraday: () => void; // ← new
}

export default function CalendarFilters({
  showVolatility,
  showVolume,
  showPerformance,
  showIntraday,
  toggleVolatility,
  toggleVolume,
  togglePerformance,
  toggleIntraday,
}: CalendarFiltersProps) {
  return (
    <div className="filters">
      <label>
        <input
          type="checkbox"
          checked={showVolatility}
          onChange={toggleVolatility}
        />
        Volatility
      </label>
      <label>
        <input type="checkbox" checked={showVolume} onChange={toggleVolume} />
        Volume
      </label>
      <label>
        <input
          type="checkbox"
          checked={showPerformance}
          onChange={togglePerformance}
        />
        Performance
      </label>
      <label>
        <input
          type="checkbox"
          checked={showIntraday}
          onChange={toggleIntraday}
        />
        Intraday
      </label>
    </div>
  );
}
