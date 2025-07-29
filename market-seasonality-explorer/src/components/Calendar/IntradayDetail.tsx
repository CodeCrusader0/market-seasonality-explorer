import React, { useEffect, useRef, useState } from "react";
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
import {
  Box,
  Heading,
  Spinner,
  Center,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

interface IntradayDetailProps {
  symbol: string;
  date: string;
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

  const chartData = ticks.map((t) => ({
    time: t.time.slice(11, 16),
    mid: (t.high + t.low) / 2,
    volume: t.volume,
  }));

  // Calculate intraday volatility (standard deviation of mid prices)
  const volatility = chartData.length
    ? (() => {
        const mids = chartData.map((t) => t.mid);
        const mean = mids.reduce((sum, val) => sum + val, 0) / mids.length;
        const variance =
          mids.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          mids.length;
        return Math.sqrt(variance).toFixed(4);
      })()
    : "N/A";

  const bg = useColorModeValue("white", "gray.700");
  const border = useColorModeValue("gray.200", "gray.600");

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popupRef.current || !anchorRect) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = popupRef.current.offsetWidth || 280;
    const popupHeight = popupRef.current.offsetHeight || 200;

    let top = anchorRect.bottom + window.scrollY + 4;
    let left = anchorRect.left + window.scrollX;

    if (left + popupWidth > viewportWidth - 10) {
      left = viewportWidth - popupWidth - 10;
    }
    if (top + popupHeight > viewportHeight + window.scrollY - 10) {
      top = anchorRect.top + window.scrollY - popupHeight - 4;
    }
    if (left < 10) {
      left = 10;
    }
    if (top < window.scrollY + 10) {
      top = window.scrollY + 10;
    }

    setPosition({ top, left });
  }, [anchorRect]);

  return (
    <Box
      ref={popupRef}
      position="fixed"
      top={`${position.top}px`}
      left={`${position.left}px`}
      bg={bg}
      border="1px solid"
      borderColor={border}
      boxShadow="md"
      borderRadius="md"
      p={4}
      zIndex={2000}
      w={{ base: "90%", sm: "280px" }}
      maxW="320px"
      minH="200px"
    >
      {isLoading ? (
        <Center h="120px">
          <Spinner />
        </Center>
      ) : (
        <>
          <Heading
            as="h4"
            size="sm"
            mb={3}
            fontSize={{ base: "1rem", sm: "1.1rem" }}
          >
            Intraday {date}
          </Heading>
          <Text fontSize="sm" mb={2}>
            Volatility: {volatility}
          </Text>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ fontSize: "0.9rem" }} />
              <Line
                type="monotone"
                dataKey="mid"
                stroke="#8884d8"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: "0.9rem" }} />
              <Bar dataKey="volume" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </Box>
  );
}
