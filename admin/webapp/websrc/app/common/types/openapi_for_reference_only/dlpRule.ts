import { CriteriaEntry } from './criteriaEntry';

export interface DlpRule {
  name: string;
  id: number;
  patterns: CriteriaEntry[];
}
