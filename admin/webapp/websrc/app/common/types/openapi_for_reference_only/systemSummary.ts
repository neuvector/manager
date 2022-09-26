export interface SystemSummary {
  hosts: number;
  controllers: number;
  enforcers: number;
  disconnected_enforcers: number;
  workloads: number;
  running_workloads: number;
  running_pods: number;
  services: number;
  policy_rules: number;
  scanners: number;
  platform: string;
  kube_version: string;
  openshift_version: string;
  cvedb_version: string;
  cvedb_create_time: string;
  component_versions: string[];
}
