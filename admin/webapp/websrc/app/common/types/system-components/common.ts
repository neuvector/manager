export * from './controllers';
export * from './enforcers';
export * from './scanners';

export interface SystemStatsData {
  id: string;
  read_at: string;
  stats: Stats;
}

export interface Stats {
  interval: number;
  total: Metry;
  span_1: Metry;
  span_12: Metry;
  span_60: Metry;
}

export interface Metry {
  cpu: number;
  memory: number;
  session_in: number;
  session_out: number;
  cur_session_in?: number;
  cur_session_out?: number;
  packet_in: number;
  packet_out: number;
  byte_in: number;
  byte_out: number;
}
