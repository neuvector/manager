import { Stats } from './stats';

export interface WorkloadStatsData {
  id: string;
  read_at: string;
  stats: Stats;
}
