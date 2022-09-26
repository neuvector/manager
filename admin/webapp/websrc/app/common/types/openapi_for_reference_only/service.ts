import { ResponseRule } from "./responseRule";
import { IpPort } from "./ipPort";
import { PolicyRule } from "./policyRule";
import { WorkloadBrief } from "./workloadBrief";

export interface Service {
  name: string;
  policy_mode: string;
  profile_mode: string;
  domain: string;
  platform_role: string;
  members: WorkloadBrief[];
  policy_rules: PolicyRule[];
  response_rules: ResponseRule[];
  service_addr?: IpPort;
  ingress_exposure: boolean;
  egress_exposure: boolean;
  cap_change_mode?: boolean;
  cap_scorable?: boolean;
}
