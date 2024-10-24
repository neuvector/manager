import { BenchItem } from './benchItem';

export interface ComplianceData {
  run_timestamp: number;
  run_at: string;
  kubernetes_cis_category: string;
  kubernetes_cis_version: string;
  docker_cis_version: string;
  items: BenchItem[];
}
