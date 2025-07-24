import axios from 'axios';

export const fetchOrderBook = async (symbol = 'BTCUSDT') => {
  const response = await axios.get(`https://api.binance.com/api/v3/depth`, {
    params: { symbol, limit: 100 }
  });
  return response.data;
};
