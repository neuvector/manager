import { AdminRuleCriterion } from "./adminRuleCriterion";

export interface AdmissionRule {
  id: number;
  category: string;
  comment: string;
  criteria: AdminRuleCriterion[];
  disable: boolean;
  critical: boolean;
  cfg_type: string;
  rule_type: string;
}
