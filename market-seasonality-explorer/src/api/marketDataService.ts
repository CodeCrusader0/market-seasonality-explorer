// src/api/marketDataService.ts
import axios from 'axios';
import type { IntradayTick } from '../data/types';

/**
 * Fetch 15‑minute klines for a single day from Binance.
 */
export async function fetchIntraday(
    symbol: string,
    date: string,
    interval: '15m' = '15m'
): Promise<IntradayTick[]> {
    const dayStart = new Date(date).setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date).setUTCHours(23, 59, 59, 999);

    const resp = await axios.get(
        'https://api.binance.com/api/v3/klines',
        {
            params: {
                symbol: symbol.toUpperCase(),
                interval,
                startTime: dayStart,
                endTime: dayEnd,
            },
        }
    );

    return resp.data.map((k: any[]) => ({
        time: new Date(k[0]).toISOString(),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        volume: parseFloat(k[5]),
    }));
}
