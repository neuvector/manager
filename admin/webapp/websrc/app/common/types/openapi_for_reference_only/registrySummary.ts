import { ScanSchedule } from './scanSchedule';
import { JfrogXray } from './jfrogXray';
import { AwsAccountKey } from './awsAccountKey';
import { GcrKey } from './gcrKey';

export interface RegistrySummary {
  name: string;
  registry_type: string;
  registry: string;
  username: string;
  password?: string;
  auth_token?: string;
  auth_with_token: boolean;
  filters: string[];
  rescan_after_db_update: boolean;
  scan_layers: boolean;
  repo_limit: number;
  tag_limit: number;
  schedule: ScanSchedule;
  aws_key?: AwsAccountKey;
  jfrog_xray?: JfrogXray;
  gcr_key?: GcrKey;
  jfrog_mode: string;
  gitlab_external_url: string;
  gitlab_private_token?: string;
  ibm_cloud_token_url: string;
  ibm_cloud_account: string;
  status: string;
  error_message: string;
  error_detail: string;
  started_at: string;
  scanned: number;
  scheduled: number;
  scanning: number;
  failed: number;
  cvedb_version: string;
  cvedb_create_time: string;
}
