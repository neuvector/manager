import { Metry } from './metry';

export interface Stats {
  interval: number;
  total: Metry;
  span_1: Metry;
  span_12: Metry;
  span_60: Metry;
}
