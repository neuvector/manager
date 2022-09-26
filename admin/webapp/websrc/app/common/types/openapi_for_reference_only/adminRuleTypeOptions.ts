import { AdminCatOptions } from "./adminCatOptions";
import { AdminRuleCriterion } from "./adminRuleCriterion";

export interface AdminRuleTypeOptions {
  deny_options: AdminCatOptions;
  exception_options: AdminCatOptions;
  psp_collection?: AdminRuleCriterion[];
}
