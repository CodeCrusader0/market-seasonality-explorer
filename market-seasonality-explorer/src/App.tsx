import { Routes, Route, Navigate } from "react-router-dom";
import Calendar from "./components/Calendar/Calendar";
import DashboardPanel from "./components/DashboardPanel";
import { useState } from "react";

const App = () => {
  const [symbol, setSymbol] = useState("BTCUSDT");

  return (
    <Routes>
      <Route
        path="/calendar"
        element={<Calendar symbol={symbol} setSymbol={setSymbol} />}
      />
      <Route
        path="/dashboard/:date"
        element={<DashboardPanel symbol={symbol} />}
      />
      <Route path="*" element={<Navigate to="/calendar" />} />
    </Routes>
  );
};

export default App;
