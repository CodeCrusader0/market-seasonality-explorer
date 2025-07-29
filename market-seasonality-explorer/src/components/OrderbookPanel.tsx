import { useQuery } from "@tanstack/react-query";
import { fetchOrderBook } from "../api/marketDataService";
import type { OrderBook } from "../data/types";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Spinner,
  Center,
  useColorModeValue,
} from "@chakra-ui/react";

export default function OrderbookPanel({ symbol }: { symbol: string }) {
  const { data, isLoading, error } = useQuery<OrderBook>({
    queryKey: ["orderbook", symbol],
    queryFn: () => fetchOrderBook(symbol),
    refetchInterval: 5000,
    staleTime: 4000,
  });

  const bg = useColorModeValue("white", "gray.700");
  const border = useColorModeValue("gray.200", "gray.600");

  if (isLoading) {
    return (
      <Center h="100px">
        <Spinner />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Center h="100px">
        <Text color="red.500">Error loading order book.</Text>
      </Center>
    );
  }

  const bids = data.bids.slice(0, 10).map(([price, qty]) => ({
    price,
    qty: +qty,
  }));
  const asks = data.asks.slice(0, 10).map(([price, qty]) => ({
    price,
    qty: +qty,
  }));
  const maxQty = Math.max(...bids.map((b) => b.qty), ...asks.map((a) => a.qty));

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="md"
      boxShadow="sm"
      p={4}
      w="100%"
    >
      <Heading as="h3" size="md" mb={4}>
        Order Book — {symbol}
      </Heading>

      <HStack align="start" spacing={4}>
        {/* BIDS column */}
        <VStack spacing={2} flex="1">
          <Text fontSize="sm" fontWeight="bold">
            BIDS
          </Text>
          {bids.map((b, i) => {
            const pct = (b.qty / maxQty) * 100;
            return (
              <HStack key={i} w="100%" spacing={2} align="center">
                <Text flex="0 0 60px" color="green.500" fontSize="sm">
                  {b.price}
                </Text>

                <Box
                  flexBasis="0"
                  flexGrow={1}
                  h="6px"
                  bg="green.100"
                  borderRadius="full"
                  overflow="hidden"
                  minW="20px"
                >
                  <Box
                    h="100%"
                    bg="green.400"
                    w={`${pct}%`}
                    transition="width 0.2s ease"
                  />
                </Box>

                <Text flex="0 0 50px" textAlign="right" fontSize="sm">
                  {b.qty.toLocaleString()}
                </Text>
              </HStack>
            );
          })}
        </VStack>

        <VStack spacing={2} flex="1">
          <Text fontSize="sm" fontWeight="bold">
            ASKS
          </Text>
          {asks.map((a, i) => {
            const pct = (a.qty / maxQty) * 100;
            return (
              <HStack key={i} w="100%" spacing={2} align="center">
                <Text flex="0 0 50px" fontSize="sm">
                  {a.qty.toLocaleString()}
                </Text>

                <Box
                  flexBasis="0"
                  flexGrow={1}
                  h="6px"
                  bg="red.100"
                  borderRadius="full"
                  overflow="hidden"
                  minW="20px"
                >
                  <Box
                    h="100%"
                    bg="red.400"
                    w={`${pct}%`}
                    transition="width 0.2s ease"
                  />
                </Box>

                <Text
                  flex="0 0 60px"
                  textAlign="right"
                  color="red.500"
                  fontSize="sm"
                >
                  {a.price}
                </Text>
              </HStack>
            );
          })}
        </VStack>
      </HStack>
    </Box>
  );
}
