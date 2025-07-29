import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
import jsPDF from "jspdf";
import {
  Box,
  Heading,
  Stack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Spinner,
  Center,
  Input,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";

interface MarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma5?: number;
  ma10?: number;
  rsi?: number;
  volatility?: number;
  benchmarkClose?: number;
}

const DashboardPanel = ({ symbol }: { symbol: string }) => {
  const { date } = useParams<{ date: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<MarketData[]>([]);
  const [comparisonData, setComparisonData] = useState<MarketData[]>([]);
  const [comparisonStart, setComparisonStart] = useState("");
  const [comparisonEnd, setComparisonEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  const queryParams = new URLSearchParams(location.search);
  const end = queryParams.get("end");

  // Fetch primary data and benchmark
  useEffect(() => {
    const fetchData = async () => {
      if (!date || !end) return;

      setLoading(true);
      const startTime = new Date(`${date}T00:00:00Z`).getTime();
      const endTime = new Date(`${end}T23:59:59Z`).getTime();

      try {
        const res = await axios.get("https://api.binance.com/api/v3/klines", {
          params: { symbol, interval: "1d", startTime, endTime },
        });

        const benchmarkRes = await axios.get(
          "https://api.binance.com/api/v3/klines",
          {
            params: { symbol: "BTCUSDT", interval: "1d", startTime, endTime },
          }
        );

        const formatted: MarketData[] = res.data.map((d: any[], i: number) => ({
          date: new Date(d[0]).toISOString().split("T")[0],
          open: +d[1],
          high: +d[2],
          low: +d[3],
          close: +d[4],
          volume: +d[5],
          benchmarkClose: +benchmarkRes.data[i][4],
        }));

        // Calculate technical indicators
        for (let i = 0; i < formatted.length; i++) {
          const slice5 = formatted.slice(i - 4, i + 1);
          if (slice5.length === 5) {
            formatted[i].ma5 = slice5.reduce((sum, x) => sum + x.close, 0) / 5;
          }
          const slice10 = formatted.slice(i - 9, i + 1);
          if (slice10.length === 10) {
            formatted[i].ma10 =
              slice10.reduce((sum, x) => sum + x.close, 0) / 10;
          }
          const rets = slice5.map((x) => (x.close - x.open) / x.open);
          const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
          formatted[i].volatility = Math.sqrt(
            rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length
          );
        }

        // Calculate RSI
        const gains: number[] = [];
        const losses: number[] = [];
        for (let i = 1; i < formatted.length; i++) {
          const diff = formatted[i].close - formatted[i - 1].close;
          gains.push(diff > 0 ? diff : 0);
          losses.push(diff < 0 ? -diff : 0);
        }
        for (let i = 13; i < formatted.length; i++) {
          const avgGain =
            gains.slice(i - 13, i).reduce((a, b) => a + b, 0) / 14;
          const avgLoss =
            losses.slice(i - 13, i).reduce((a, b) => a + b, 0) / 14;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          formatted[i].rsi = 100 - 100 / (1 + rs);
        }

        setData(formatted);
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date, end, symbol]);

  // Fetch comparison data
  const fetchComparisonData = async () => {
    if (!comparisonStart || !comparisonEnd) return;

    try {
      const startTime = new Date(`${comparisonStart}T00:00:00Z`).getTime();
      const endTime = new Date(`${comparisonEnd}T23:59:59Z`).getTime();

      const res = await axios.get("https://api.binance.com/api/v3/klines", {
        params: { symbol, interval: "1d", startTime, endTime },
      });

      const formatted: MarketData[] = res.data.map((d: any[]) => ({
        date: new Date(d[0]).toISOString().split("T")[0],
        open: +d[1],
        high: +d[2],
        low: +d[3],
        close: +d[4],
        volume: +d[5],
      }));

      setComparisonData(formatted);
    } catch (err) {
      console.error("Error fetching comparison data", err);
    }
  };

  // Export functions
  const exportCSV = () => {
    let csv =
      "Date,Open,High,Low,Close,Volume,MA5,MA10,RSI,Volatility,BenchmarkClose\n";
    data.forEach((d) => {
      csv += `${d.date},${d.open},${d.high},${d.low},${d.close},${d.volume},${
        d.ma5 ?? ""
      },${d.ma10 ?? ""},${d.rsi?.toFixed(2) ?? ""},${
        d.volatility?.toFixed(4) ?? ""
      },${d.benchmarkClose ?? ""}\n`;
    });
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${symbol}_data.csv`
    );
  };

  const exportPNG = () => {
    if (!chartRef.current) return;
    htmlToImage
      .toPng(chartRef.current)
      .then((url) => {
        const link = document.createElement("a");
        link.download = `${symbol}_dashboard.png`;
        link.href = url;
        link.click();
      })
      .catch((e) => console.error("PNG export failed", e));
  };

  const exportPDF = () => {
    if (!chartRef.current) return;
    htmlToImage
      .toPng(chartRef.current)
      .then((dataUrl) => {
        const pdf = new jsPDF("portrait", "mm", "a4");
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${symbol}_dashboard.pdf`);
      })
      .catch((e) => console.error("PDF export failed", e));
  };

  // Theme colors
  const bg = useColorModeValue("calendar.bg", "gray.700");
  const border = useColorModeValue("calendar.border", "gray.600");
  const tableHeaderBg = useColorModeValue("calendar.dayLabelBg", "gray.600");
  const chartStrokePrimary = useColorModeValue(
    "calendar.buttonHover",
    "#8884d8"
  );
  const chartStrokeSecondary = useColorModeValue("calendar.badgeBg", "#00ff00");

  if (loading) {
    return (
      <Center h="100%">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box
      p={4}
      bg={bg}
      border="1px"
      borderColor={border}
      borderRadius="md"
      boxShadow="sm"
      ref={chartRef}
    >
      <Heading as="h2" size="lg" mb={4}>
        Dashboard: {date} &rarr; {end} — {symbol}
      </Heading>

      <Stack direction="row" spacing={4} mb={6}>
        <Button onClick={exportCSV} colorScheme="blue">
          Export CSV
        </Button>
        <Button onClick={exportPNG} colorScheme="blue" variant="outline">
          Export PNG
        </Button>
        <Button onClick={exportPDF} colorScheme="blue" variant="outline">
          Export PDF
        </Button>
        <Button
          onClick={() => navigate("/")}
          colorScheme="blue"
          variant="outline"
        >
          Back to Calendar
        </Button>
      </Stack>

      <Box mb={8}>
        <Heading as="h3" size="md" mb={4}>
          Compare Another Period
        </Heading>
        <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={4}>
          <FormControl>
            <FormLabel>Start Date</FormLabel>
            <Input
              type="date"
              value={comparisonStart}
              onChange={(e) => setComparisonStart(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>End Date</FormLabel>
            <Input
              type="date"
              value={comparisonEnd}
              onChange={(e) => setComparisonEnd(e.target.value)}
            />
          </FormControl>
          <Button
            onClick={fetchComparisonData}
            colorScheme="blue"
            alignSelf={{ base: "flex-start", md: "flex-end" }}
          >
            Compare
          </Button>
        </Stack>
        {comparisonData.length > 0 && (
          <Box>
            <Heading as="h4" size="sm" mb={2}>
              Comparison Period: {comparisonStart} &rarr; {comparisonEnd}
            </Heading>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data}
                syncId="main"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="close"
                  name="Primary Close"
                  stroke={chartStrokePrimary}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={comparisonData}
                syncId="main"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="close"
                  name="Comparison Close"
                  stroke={chartStrokeSecondary}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>

      <Box mb={8}>
        <Heading as="h3" size="md" mb={2}>
          Close Price, Moving Averages & Benchmark
        </Heading>
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
              name="Close"
              stroke={chartStrokePrimary}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="ma5"
              name="MA5"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="ma10"
              name="MA10"
              stroke="#ff7300"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="benchmarkClose"
              name="BTCUSDT Benchmark"
              stroke="#ff4560"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Box mb={8}>
        <Heading as="h3" size="md" mb={2}>
          Volume
        </Heading>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="volume" name="Volume" fill={chartStrokePrimary} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box mb={8}>
        <Heading as="h3" size="md" mb={2}>
          Volatility
        </Heading>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="volatility"
              name="Volatility"
              stroke="#ff4560"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Box mb={8}>
        <Heading as="h3" size="md" mb={2}>
          RSI (Relative Strength Index)
        </Heading>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="rsi"
              name="RSI"
              stroke="#ff4560"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Heading as="h3" size="md" mb={2}>
        Raw Data
      </Heading>
      <Box overflowX="auto">
        <Table variant="striped" size="sm">
          <Thead bg={tableHeaderBg}>
            <Tr>
              <Th>Date</Th>
              <Th isNumeric>Open</Th>
              <Th isNumeric>High</Th>
              <Th isNumeric>Low</Th>
              <Th isNumeric>Close</Th>
              <Th isNumeric>Volume</Th>
              <Th isNumeric>MA5</Th>
              <Th isNumeric>MA10</Th>
              <Th isNumeric>Volatility</Th>
              <Th isNumeric>RSI</Th>
              <Th isNumeric>Benchmark Close</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((d) => (
              <Tr key={d.date}>
                <Td>{d.date}</Td>
                <Td isNumeric>{d.open.toFixed(2)}</Td>
                <Td isNumeric>{d.high.toFixed(2)}</Td>
                <Td isNumeric>{d.low.toFixed(2)}</Td>
                <Td isNumeric>{d.close.toFixed(2)}</Td>
                <Td isNumeric>{d.volume.toLocaleString()}</Td>
                <Td isNumeric>{d.ma5?.toFixed(2) ?? "-"}</Td>
                <Td isNumeric>{d.ma10?.toFixed(2) ?? "-"}</Td>
                <Td isNumeric>{d.volatility?.toFixed(4) ?? "-"}</Td>
                <Td isNumeric>{d.rsi?.toFixed(2) ?? "-"}</Td>
                <Td isNumeric>{d.benchmarkClose?.toFixed(2) ?? "-"}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default DashboardPanel;
