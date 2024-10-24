import { PolicyRule } from './policyRule';

export interface PolicyRuleInsert {
  after?: number;
  rules: PolicyRule[];
}
