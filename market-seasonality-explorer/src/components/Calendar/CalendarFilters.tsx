import { HStack, Checkbox, Select } from "@chakra-ui/react";

interface CalendarFiltersProps {
  showVolatility: boolean;
  showVolume: boolean;
  showPerformance: boolean;
  showIntraday: boolean;
  toggleVolatility: () => void;
  toggleVolume: () => void;
  togglePerformance: () => void;
  toggleIntraday: () => void;
  setTimePeriod: (period: string) => void;
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
  setTimePeriod,
}: CalendarFiltersProps) {
  return (
    <HStack spacing={4} mb={4} flexWrap="wrap">
      <Checkbox isChecked={showVolatility} onChange={toggleVolatility}>
        Volatility
      </Checkbox>
      <Checkbox isChecked={showVolume} onChange={toggleVolume}>
        Volume
      </Checkbox>
      <Checkbox isChecked={showPerformance} onChange={togglePerformance}>
        Performance
      </Checkbox>
      <Checkbox isChecked={showIntraday} onChange={toggleIntraday}>
        Intraday
      </Checkbox>
      <Select
        w="150px"
        onChange={(e) => setTimePeriod(e.target.value)}
        placeholder="Select Time Period"
      >
        <option value="all">All Time</option>
        <option value="last30">Last 30 Days</option>
        <option value="last90">Last 90 Days</option>
        <option value="ytd">Year to Date</option>
      </Select>
    </HStack>
  );
}
