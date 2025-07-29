import React from "react";
import { Flex, Box, Text } from "@chakra-ui/react";

export default function DayLabels() {
  return (
    <Flex mb={2}>
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <Box key={d} flex={1} textAlign="center">
          <Text fontWeight="bold">{d}</Text>
        </Box>
      ))}
    </Flex>
  );
}
