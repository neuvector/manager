import { CriteriaEntry } from './criteriaEntry';
import { ResponseRule } from './responseRule';
import { PolicyRule } from './policyRule';
import { WorkloadBrief } from './workloadBrief';

export interface GroupDetail {
  name: string;
  learned: boolean;
  reserved: boolean;
  policy_mode?: string;
  domain: string;
  creater_domains: string[];
  kind: string;
  platform_role: string;
  cap_change_mode: boolean;
  cfg_type: string;
  criteria: CriteriaEntry[];
  members: WorkloadBrief[];
  policy_rules: PolicyRule[];
  response_rules: ResponseRule[];
}
