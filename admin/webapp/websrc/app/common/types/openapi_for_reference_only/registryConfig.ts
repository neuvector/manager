import { ScanSchedule } from "./scanSchedule";
import { AwsAccountKeyConfig } from "./awsAccountKeyConfig";
import { JfrogXrayConfig } from "./jfrogXrayConfig";
import { GcrKeyConfig } from "./gcrKeyConfig";

export interface RegistryConfig {
  name: string;
  registry_type: string;
  registry?: string;
  filters?: string[];
  username?: string;
  password?: string;
  auth_token?: string;
  auth_with_token?: boolean;
  rescan_after_db_update?: boolean;
  scan_layers?: boolean;
  repo_limit?: number;
  tag_limit?: number;
  schedule?: ScanSchedule;
  aws_key?: AwsAccountKeyConfig;
  jfrog_xray?: JfrogXrayConfig;
  gcr_key?: GcrKeyConfig;
  jfrog_mode?: string;
  jfrog_aql?: boolean;
  gitlab_external_url?: string;
  gitlab_private_token?: string;
  ibm_cloud_token_url?: string;
  ibm_cloud_account?: string;
}
