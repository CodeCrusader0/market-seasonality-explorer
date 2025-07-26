// src/data/types.ts

/** A single intraday tick (e.g. 15‑min K‑line) */
export interface IntradayTick {
    time: string;      // ISO timestamp or HH:mm
    high: number;
    low: number;
    volume: number;
}

/** Daily OHLCV plus symbol */
export interface MarketData {
    symbol: string;
    date: string;      // “YYYY-MM-DD”
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    intraday?: IntradayTick[];
}
