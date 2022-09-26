import { Vulnerability } from "./vulnerability";
import { RegistryImageSummaryLabels } from "./registryImageSummaryLabels";
import { ScanModule } from "./scanModule";
import { ScanLayer } from "./scanLayer";

export interface ScanRepoReport {
  verdict?: string;
  image_id: string;
  registry: string;
  repository: string;
  tag: string;
  digest: string;
  size: number;
  author: string;
  base_os: string;
  cvedb_version: string;
  cvedb_create_time: string;
  layers: ScanLayer[];
  vulnerabilities: Vulnerability[];
  modules: ScanModule[];
  envs: string[];
  labels: RegistryImageSummaryLabels;
}
