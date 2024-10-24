import { DlpRule } from './dlpRule';

export interface DlpSensor {
  name: string;
  groups: string[];
  rules: DlpRule[];
  comment: string;
  predefine: boolean;
}
