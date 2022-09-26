import { PolicyRuleMove } from "./policyRuleMove";
import { PolicyRule } from "./policyRule";
import { PolicyRuleInsert } from "./policyRuleInsert";

export interface PolicyRuleActionData {
  move?: PolicyRuleMove;
  insert?: PolicyRuleInsert;
  rules?: PolicyRule[];
  _delete?: number[];
}
