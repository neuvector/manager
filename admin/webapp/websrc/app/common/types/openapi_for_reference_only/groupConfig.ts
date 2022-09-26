import { CriteriaEntry } from "./criteriaEntry";

export interface GroupConfig {
  name: string;
  criteria?: CriteriaEntry[];
  cfg_type: string;
}
