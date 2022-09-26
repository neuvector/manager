import { BenchItem } from "./benchItem";

export interface BenchReport {
  run_timestamp: number;
  run_at: string;
  cis_version: string;
  items: BenchItem[];
}
