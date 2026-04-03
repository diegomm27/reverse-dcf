import axios from 'axios';
import { StockFinancials } from '../types';

const BASE_URL = '/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
});

export async function fetchStockData(ticker: string): Promise<StockFinancials> {
  const { data } = await client.get<StockFinancials>(`/stock/${ticker.toUpperCase()}`);
  return data;
}
