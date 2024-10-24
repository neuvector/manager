import { DlpRule } from './dlpRule';

export interface DlpRuleDetail {
  sensors: string[];
  rules: DlpRule[];
}
