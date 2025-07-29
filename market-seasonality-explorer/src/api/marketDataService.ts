import axios from 'axios';
import type { IntradayTick, OrderBook } from '../data/types';

export async function fetchIntraday(
    symbol: string,
    date: string,
    interval: '15m' = '15m'
): Promise<IntradayTick[]> {
    const dayStart = new Date(date).setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date).setUTCHours(23, 59, 59, 999);

    const resp = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
            symbol: symbol.toUpperCase(),
            interval,
            startTime: dayStart,
            endTime: dayEnd,
        },
    });

    return resp.data.map((k: any[]) => ({
        time: new Date(k[0]).toISOString(),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        volume: parseFloat(k[5]),
    }));
}


export async function fetchOrderBook(
    symbol: string = 'BTCUSDT'
): Promise<OrderBook> {
    const resp = await axios.get<OrderBook>(
        'https://api.binance.com/api/v3/depth',
        { params: { symbol, limit: 100 } }
    );
    return resp.data;
}
