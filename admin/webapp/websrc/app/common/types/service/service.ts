import { NetworkRule, PolicyMode, ProfileBaseline, ResponseRule } from '..';
import { WorkloadBrief } from '../compliance/workloadBrief';

export interface Service {
  name: string;
  baseline_profile: ProfileBaseline;
  policy_mode: PolicyMode;
  profile_mode: PolicyMode;
  domain: string;
  platform_role: string;
  members: WorkloadBrief[];
  policy_rules: NetworkRule[];
  response_rules: ResponseRule[];
  service_addr?: IpPort;
  ingress_exposure: boolean;
  egress_exposure: boolean;
  cap_change_mode?: boolean;
  cap_scorable?: boolean;
  comment: string;
  not_scored: boolean;
}

export interface IpPort {
  ip: string;
  port: number;
}
