import { SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import type { WeekSummary as WeekSummaryType } from "./Calendar";

interface WeeklySummaryProps {
  summary: WeekSummaryType;
}

export default function WeeklySummary({ summary }: WeeklySummaryProps) {
  const bg = useColorModeValue("gray.50", "gray.600");
  const color = useColorModeValue("gray.600", "gray.200");

  return (
    <SimpleGrid
      columns={4}
      bg={bg}
      color={color}
      fontSize="sm"
      py={2}
      px={4}
      borderBottom="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.700")}
    >
      <Text>Week of {summary.weekStart}</Text>
      <Text>Avg Vol: {summary.avgVolatility.toFixed(4)}</Text>
      <Text>Tot Vol: {summary.totalVolume.toLocaleString()}</Text>
      <Text>Avg Close: {summary.avgClose.toFixed(2)}</Text>
    </SimpleGrid>
  );
}
