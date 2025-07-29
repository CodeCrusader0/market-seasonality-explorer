import React, { useState, useRef, useEffect, type KeyboardEvent } from "react";
import moment, { type Moment } from "moment";
import axios from "axios";
import { saveAs } from "file-saver";
import { useSwipeable } from "react-swipeable";
import jsPDF from "jspdf";
import { motion } from "framer-motion";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Select,
  Stack,
  Button,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import OrderbookPanel from "../OrderbookPanel";
import CalendarGrid from "./CalendarGrid";
import IntradayDetail from "./IntradayDetail";
import CalendarFilters from "./CalendarFilters";
import DayLabels from "./DayLabels";

import type { MarketData } from "../../data/types";

export const VIEWS = ["Daily", "Weekly", "Monthly"] as const;
export type ViewType = (typeof VIEWS)[number];

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
  // --- STATE ---
  const [currentMonth, setCurrentMonth] = useState<Moment>(moment());
  const [view, setView] = useState<ViewType>("Monthly");
  const [rangeStart, setRangeStart] = useState<Moment | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Moment | null>(null);
  const [hoverDate, setHoverDate] = useState<Moment | null>(null);
  const [focusDate, setFocusDate] = useState<Moment | null>(null);
  const [showIntraday, setShowIntraday] = useState(false);
  const [intradayHover, setIntradayHover] = useState<{
    date: string;
    rect: DOMRect;
  } | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>("all");
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
  const [alerts, setAlerts] = useState<
    { volatility?: number; performance?: number; date: string }[]
  >([]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertVolatility, setAlertVolatility] = useState("");
  const [alertPerformance, setAlertPerformance] = useState("");

  const navigate = useNavigate();
  const toast = useToast();
  const today = moment().format("YYYY-MM-DD");
  const calendarRef = useRef<HTMLDivElement>(null);

  // --- SWIPE HANDLERS ---
  const handlers = useSwipeable({
    onSwipedLeft: () =>
      setCurrentMonth((m) =>
        m
          .clone()
          .add(
            1,
            view === "Monthly" ? "month" : view === "Weekly" ? "week" : "day"
          )
      ),
    onSwipedRight: () =>
      setCurrentMonth((m) =>
        m
          .clone()
          .subtract(
            1,
            view === "Monthly" ? "month" : view === "Weekly" ? "week" : "day"
          )
      ),
    trackMouse: false,
    delta: 10,
  });

  // --- DATA FETCH ---
  useEffect(() => {
    (async () => {
      let start = currentMonth
        .clone()
        .startOf("month")
        .startOf("week")
        .valueOf();
      let end = currentMonth.clone().endOf("month").endOf("week").valueOf();

      if (timePeriod === "last30") {
        start = moment().subtract(30, "days").startOf("day").valueOf();
        end = moment().endOf("day").valueOf();
      } else if (timePeriod === "last90") {
        start = moment().subtract(90, "days").startOf("day").valueOf();
        end = moment().endOf("day").valueOf();
      } else if (timePeriod === "ytd") {
        start = moment().startOf("year").startOf("day").valueOf();
        end = moment().endOf("day").valueOf();
      }

      try {
        const res = await axios.get("https://api.binance.com/api/v3/klines", {
          params: { symbol, interval: "1d", startTime: start, endTime: end },
        });
        const arr: MarketData[] = res.data.map((d: any[]) => ({
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
        setMaxVolume(Math.max(...arr.map((m) => m.volume)));

        const windowSize = 5;
        const vol: Record<string, number> = {};
        const ma: Record<string, number> = {};
        for (let i = windowSize - 1; i < arr.length; i++) {
          const slice = arr.slice(i - windowSize + 1, i + 1);
          const rets = slice.map((x) => (x.close - x.open) / x.open);
          const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
          vol[slice[windowSize - 1].date] = Math.sqrt(
            rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length
          );
          ma[slice[windowSize - 1].date] =
            slice.reduce((s, x) => s + x.close, 0) / windowSize;
        }
        setVolatilityMap(vol);
        setMaMap(ma);

        // Check alerts
        Object.keys(vol).forEach((date) => {
          const md = map[date];
          const perf = md ? ((md.close - md.open) / md.open) * 100 : 0;
          alerts.forEach((alert) => {
            if (
              (alert.volatility && vol[date] > alert.volatility) ||
              (alert.performance && Math.abs(perf) > alert.performance)
            ) {
              toast({
                title: `Alert on ${date}`,
                description: `Volatility: ${vol[date].toFixed(
                  4
                )}, Performance: ${perf.toFixed(2)}%`,
                status: "warning",
                duration: 5000,
                isClosable: true,
              });
            }
          });
        });
      } catch (err) {
        console.error(err);
      }
    })();
  }, [currentMonth, symbol, timePeriod, alerts, toast]);

  // --- HELPERS ---
  const getVolColor = (s: number) =>
    s < 0.01 ? "green" : s < 0.02 ? "orange" : "red";

  const inRange = (d: Moment) =>
    !!rangeStart &&
    !!rangeEnd &&
    d.isSameOrAfter(rangeStart, "day") &&
    d.isSameOrBefore(rangeEnd, "day");

  const handleSelectDate = (d: Moment) => {
    if (!rangeStart) setRangeStart(d);
    else if (!rangeEnd) {
      if (d.isBefore(rangeStart)) {
        setRangeEnd(rangeStart);
        setRangeStart(d);
      } else {
        setRangeEnd(d);
      }
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

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, d: Moment) => {
    if (e.key === "Enter") handleSelectDate(d);
    if (e.key === "Escape") {
      setFocusDate(null);
      setRangeStart(null);
      setRangeEnd(null);
    }
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      moveFocus(e.key.replace("Arrow", "").toLowerCase() as any);
    }
  };

  // Exports
  const exportToCSV = () => {
    if (!rangeStart || !rangeEnd) return;
    let csv = "Date,Open,High,Low,Close,Volume,Volatility,MA\n";
    let cursor = rangeStart.clone();
    while (cursor.isSameOrBefore(rangeEnd, "day")) {
      const ds = cursor.format("YYYY-MM-DD");
      const md = calendarData[ds];
      const vol = volatilityMap[ds] ?? 0;
      const mavg = maMap[ds] ?? 0;
      if (md) {
        csv += `${ds},${md.open},${md.high},${md.low},${md.close},${
          md.volume
        },${vol.toFixed(4)},${mavg.toFixed(2)}\n`;
      }
      cursor.add(1, "day");
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

  const exportToPDF = () => {
    if (!calendarRef.current) return;
    import("html-to-image").then((h) => {
      h.toPng(calendarRef.current!).then((dataUrl) => {
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("calendar.pdf");
      });
    });
  };

  // Alert handling
  const handleAddAlert = () => {
    if (!rangeStart) return;
    const newAlert = {
      volatility: alertVolatility ? parseFloat(alertVolatility) : undefined,
      performance: alertPerformance ? parseFloat(alertPerformance) : undefined,
      date: rangeStart.format("YYYY-MM-DD"),
    };
    setAlerts([...alerts, newAlert]);
    setIsAlertModalOpen(false);
    setAlertVolatility("");
    setAlertPerformance("");
    toast({
      title: "Alert Added",
      description: `Alert set for ${rangeStart.format("MMM D, YYYY")}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Theming
  const bg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Animation variants
  const gridVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // --- RENDER ---
  return (
    <Flex p={4} gap={6}>
      <Box
        flex={3}
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        boxShadow="sm"
        borderRadius="md"
        p={4}
        {...handlers}
      >
        <Flex align="center" mb={4}>
          <IconButton
            aria-label="Previous"
            icon={<ChevronLeftIcon />}
            onClick={() =>
              setCurrentMonth((m) =>
                m
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
          />
          <Heading flex={1} size="md" textAlign="center">
            {view === "Monthly"
              ? currentMonth.format("MMMM YYYY")
              : view === "Weekly"
              ? `Week of ${currentMonth.format("MMM D, YYYY")}`
              : currentMonth.format("dddd, MMM D")}
          </Heading>
          <IconButton
            aria-label="Next"
            icon={<ChevronRightIcon />}
            onClick={() =>
              setCurrentMonth((m) =>
                m
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
          />
        </Flex>

        <Stack direction="row" spacing={2} mb={4}>
          <Select
            w="100px"
            value={view}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setView(e.target.value as ViewType)
            }
          >
            {VIEWS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>

          <Select
            w="100px"
            value={symbol}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSymbol(e.target.value)
            }
          >
            <option value="BTCUSDT">BTC</option>
            <option value="ETHUSDT">ETH</option>
            <option value="BNBUSDT">BNB</option>
          </Select>
        </Stack>

        <CalendarFilters
          showVolatility={showVolatility}
          showVolume={showVolume}
          showPerformance={showPerformance}
          showIntraday={showIntraday}
          toggleVolatility={() => setShowVolatility((v) => !v)}
          toggleVolume={() => setShowVolume((v) => !v)}
          togglePerformance={() => setShowPerformance((v) => !v)}
          toggleIntraday={() => setShowIntraday((v) => !v)}
          setTimePeriod={setTimePeriod}
        />

        {rangeStart && rangeEnd && (
          <Box color="blue.500" mb={4}>
            Selected: {rangeStart.format("MMM D")} – {rangeEnd.format("MMM D")}
          </Box>
        )}

        <DayLabels />

        <motion.div
          ref={calendarRef}
          variants={gridVariants}
          initial="hidden"
          animate="visible"
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
            onCellKeyDown={handleKeyDown}
            showVolatility={showVolatility}
            showVolume={showVolume}
            showPerformance={showPerformance}
            showIntraday={showIntraday}
            onIntradayHover={(date, rect) => setIntradayHover({ date, rect })}
            onIntradayLeave={() => setIntradayHover(null)}
            alerts={alerts}
          />
        </motion.div>

        {intradayHover && (
          <IntradayDetail
            symbol={symbol}
            date={intradayHover.date}
            anchorRect={intradayHover.rect}
          />
        )}

        {rangeStart && rangeEnd && (
          <Stack direction="row" spacing={2} mt={4}>
            <Button
              colorScheme="blue"
              onClick={() =>
                navigate(
                  `/dashboard/${rangeStart.format(
                    "YYYY-MM-DD"
                  )}?end=${rangeEnd.format("YYYY-MM-DD")}`
                )
              }
            >
              Zoom In ({rangeStart.format("MMM D")}–{rangeEnd.format("MMM D")})
            </Button>
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={() => setIsAlertModalOpen(true)}
            >
              Set Alert
            </Button>
          </Stack>
        )}

        <Stack direction="row" spacing={2} mt={2}>
          <Button onClick={exportToCSV}>Export CSV</Button>
          <Button onClick={exportToPNG}>Export PNG</Button>
          <Button onClick={exportToPDF}>Export PDF</Button>
        </Stack>

        <Modal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Set Alert</ModalHeader>
            <ModalBody>
              <FormControl mb={4}>
                <FormLabel>Volatility Threshold (%)</FormLabel>
                <Input
                  type="number"
                  value={alertVolatility}
                  onChange={(e) => setAlertVolatility(e.target.value)}
                  placeholder="e.g., 0.02"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Performance Threshold (%)</FormLabel>
                <Input
                  type="number"
                  value={alertPerformance}
                  onChange={(e) => setAlertPerformance(e.target.value)}
                  placeholder="e.g., 5"
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                onClick={() => setIsAlertModalOpen(false)}
              >
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleAddAlert}>
                Save
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>

      <Box flex="0 0 300px">
        <OrderbookPanel symbol={symbol} />
      </Box>
    </Flex>
  );
}
