export interface IntradayTick {
    time: string;     
    high: number;
    low: number;
    volume: number;
}


export interface MarketData {
    symbol: string;
    date: string;  
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    intraday?: IntradayTick[];
}

export interface OrderBook {
    lastUpdateId: number;
    bids: [string, string][];  
    asks: [string, string][];
}
