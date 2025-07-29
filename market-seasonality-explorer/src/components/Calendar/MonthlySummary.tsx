import { SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import styles from "./Calendar.module.scss";

interface MonthlySummaryProps {
  summary: {
    month: string;
    avgVolatility: number;
    totalVolume: number;
    avgClose: number;
    performance: number;
  };
}

export default function MonthlySummary({ summary }: MonthlySummaryProps) {
  const bg = useColorModeValue("gray.50", "gray.600");
  const color = useColorModeValue("gray.600", "gray.200");

  return (
    <SimpleGrid
      columns={{ base: 1, sm: 4 }}
      bg={bg}
      color={color}
      fontSize="sm"
      py={2}
      px={4}
      borderBottom="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      className={styles.monthSummary}
    >
      <Text>Month: {summary.month}</Text>
      <Text>Avg Volatility: {summary.avgVolatility.toFixed(4)}</Text>
      <Text>Total Volume: {summary.totalVolume.toLocaleString()}</Text>
      <Text>Avg Close: {summary.avgClose.toFixed(2)}</Text>
      <Text>Performance: {summary.performance.toFixed(2)}%</Text>
    </SimpleGrid>
  );
}
