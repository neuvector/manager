import { Check } from '..';

export interface WorkloadCompliance {
  items: Check[];
  docker_cis_version: string;
  kubernetes_cis_category: string;
  kubernetes_cis_version: string;
  run_at: string;
  run_timestamp: number;
}
