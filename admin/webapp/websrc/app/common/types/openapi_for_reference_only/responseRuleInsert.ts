import { ResponseRule } from "./responseRule";

export interface ResponseRuleInsert {
  after?: number;
  rules: ResponseRule[];
}
