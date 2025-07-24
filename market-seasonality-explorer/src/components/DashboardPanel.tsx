import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { saveAs } from "file-saver";
import * as htmlToImage from "html-to-image";


interface MarketData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
  ma5?: number;
  ma10?: number;
  rsi?: number;
}

const DashboardPanel = ({ symbol }: { symbol: string }) => {
  const { date } = useParams(); // start date
  const location = useLocation();
  const [data, setData] = useState<MarketData[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  const queryParams = new URLSearchParams(location.search);
  const end = queryParams.get("end");

  useEffect(() => {
    const fetchData = async () => {
      if (!date || !end) return;

      const startTime = new Date(`${date}T00:00:00Z`).getTime();
      const endTime = new Date(`${end}T23:59:59Z`).getTime();

      try {
        const res = await axios.get("https://api.binance.com/api/v3/klines", {
          params: {
            symbol,
            interval: "1d",
            startTime,
            endTime,
          },
        });

        const formattedData: MarketData[] = res.data.map((d: any) => ({
          date: new Date(d[0]).toISOString().split("T")[0],
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
          volume: parseFloat(d[5]),
        }));

        // Calculate MA5 and MA10
        for (let i = 0; i < formattedData.length; i++) {
          const slice5 = formattedData.slice(i - 4, i + 1);
          if (slice5.length === 5) {
            formattedData[i].ma5 =
              slice5.reduce((acc, d) => acc + d.close, 0) / 5;
          }
          const slice10 = formattedData.slice(i - 9, i + 1);
          if (slice10.length === 10) {
            formattedData[i].ma10 =
              slice10.reduce((acc, d) => acc + d.close, 0) / 10;
          }
        }

        // Calculate RSI
        const gains: number[] = [];
        const losses: number[] = [];
        for (let i = 1; i < formattedData.length; i++) {
          const diff = formattedData[i].close - formattedData[i - 1].close;
          gains.push(diff > 0 ? diff : 0);
          losses.push(diff < 0 ? -diff : 0);
        }

        for (let i = 13; i < formattedData.length; i++) {
          const avgGain =
            gains.slice(i - 13, i).reduce((a, b) => a + b, 0) / 14;
          const avgLoss =
            losses.slice(i - 13, i).reduce((a, b) => a + b, 0) / 14;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          formattedData[i].rsi = 100 - 100 / (1 + rs);
        }

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching Binance data", error);
      }
    };

    fetchData();
  }, [date, end, symbol]);

  const exportCSV = () => {
    let csv = "Date,Open,High,Low,Close,Volume,MA5,MA10,RSI\n";
    data.forEach((d) => {
      csv += `${d.date},${d.open},${d.high},${d.low},${d.close},${d.volume},${
        d.ma5 ?? ""
      },${d.ma10 ?? ""},${d.rsi?.toFixed(2) ?? ""}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${symbol}_dashboard_data.csv`);
  };

  const exportPNG = () => {
    if (!chartRef.current) return;
    htmlToImage
      .toPng(chartRef.current)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${symbol}_dashboard.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("PNG export failed", err);
      });
  };

  return (
    <div style={{ padding: "1rem" }} ref={chartRef}>
      <h2>
        Dashboard ({date} → {end}) — {symbol}
      </h2>

      {data.length > 0 ? (
        <>
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={exportPNG} style={{ marginLeft: "8px" }}>
            Export PNG
          </button>

          <h3>Close Price & Moving Averages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#8884d8"
                strokeWidth={2}
                name="Close"
              />
              <Line
                type="monotone"
                dataKey="ma5"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                name="MA5"
              />
              <Line
                type="monotone"
                dataKey="ma10"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
                name="MA10"
              />
            </LineChart>
          </ResponsiveContainer>

          <h3>Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="volume" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>

          <h3>RSI (Relative Strength Index)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="#ff4560"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <h3>Raw Data</h3>
          <table border={1} cellPadding={8}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
                <th>Close</th>
                <th>Volume</th>
                <th>MA5</th>
                <th>MA10</th>
                <th>RSI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{row.open}</td>
                  <td>{row.high}</td>
                  <td>{row.low}</td>
                  <td>{row.close}</td>
                  <td>{row.volume}</td>
                  <td>{row.ma5?.toFixed(2) ?? "-"}</td>
                  <td>{row.ma10?.toFixed(2) ?? "-"}</td>
                  <td>{row.rsi?.toFixed(2) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>Loading market data...</p>
      )}
    </div>
  );
};

export default DashboardPanel;
