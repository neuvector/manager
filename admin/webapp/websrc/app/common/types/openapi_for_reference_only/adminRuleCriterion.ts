export interface AdminRuleCriterion {
  name: string;
  op: string;
  value: string;
  sub_criteria?: AdminRuleCriterion[];
}
