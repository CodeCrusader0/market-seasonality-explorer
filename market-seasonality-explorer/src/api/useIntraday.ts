import { useQuery } from '@tanstack/react-query';
import { fetchIntraday } from './marketDataService';
import type { IntradayTick } from '../data/types';

export function useIntraday(symbol: string, date: string, p0: { enabled: boolean; }) {
    return useQuery<IntradayTick[]>({
        queryKey: ['intraday', symbol, date],
        queryFn: () => fetchIntraday(symbol, date),
        enabled: !!symbol && !!date,
        staleTime: 5 * 60 * 1000,         // cache for 5m
        refetchOnWindowFocus: false,
    });
}
