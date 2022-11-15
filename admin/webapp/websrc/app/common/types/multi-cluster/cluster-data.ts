import {Cluster} from "@common/types";

export interface ClusterData {
  fed_role: string;
  local_rest_info?: {
    server: string;
    port: number;
  };
  clusters?: Cluster[];
  use_proxy?: string;
  deploy_reg_scan_data?: boolean,
  deploy_repo_scan_data?: boolean
}
