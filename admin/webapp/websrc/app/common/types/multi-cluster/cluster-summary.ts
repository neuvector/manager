export interface ClusterSummary{
  platform?: string;
  domains?: string;
  services?: string;
  controllers: string;
  workloads: string;
  running_pods: string;
  hosts: string;
  cvedb_version: string;
  enforcers: string;
  scanners: string;
}
