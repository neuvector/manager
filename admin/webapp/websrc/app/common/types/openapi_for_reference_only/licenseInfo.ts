export interface LicenseInfo {
  name: string;
  email: string;
  phone: string;
  id?: string;
  id_type?: string;
  licence_type?: string;
  license_model: string;
  instance_id: string;
  instance_key: string;
  issue: string;
  expire: string;
  installation_id: string;
  grace_period?: number;
  node_limit: number;
  cpu_limit?: number;
  multi_cluster_limit?: number;
  scan: boolean;
  enforce: boolean;
  serverless: boolean;
}
