import { AdminRuleCriterion } from "./adminRuleCriterion";

export interface AdmissionRuleConfig {
  id: number;
  category: string;
  comment?: string;
  criteria?: AdminRuleCriterion[];
  disable?: boolean;
  actions?: string[];
  cfg_type: string;
  rule_type: string;
}
