import { RegistryImageSummaryLabels } from './registryImageSummaryLabels';

export interface RegistryImageSummary {
  domain: string;
  repository: string;
  tag: string;
  image_id: string;
  digest: string;
  size: number;
  author: string;
  run_as_root: boolean;
  envs: string[];
  labels: RegistryImageSummaryLabels;
  layers: string[];
  status: string;
  critical: number;
  high: number;
  medium: number;
  result: string;
  scanned_timestamp: number;
  scanned_at: string;
  base_os: string;
  scanner_version: string;
  cvedb_create_time?: string;
}
