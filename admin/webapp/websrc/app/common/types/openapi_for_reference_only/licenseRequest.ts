export interface LicenseRequest {
  name: string;
  email: string;
  phone: string;
  months: number;
  node_limit: number;
  cpu_limit?: number;
  multi_cluster_limit: number;
  scan: boolean;
  enforce: boolean;
}
