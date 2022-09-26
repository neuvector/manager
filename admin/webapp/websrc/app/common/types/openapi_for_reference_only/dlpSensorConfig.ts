import { DlpRule } from "./dlpRule";

export interface DlpSensorConfig {
  name: string;
  change?: DlpRule[];
  _delete?: DlpRule[];
  rules?: DlpRule[];
  comment?: string;
}
