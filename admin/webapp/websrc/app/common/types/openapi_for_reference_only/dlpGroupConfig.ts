import { DlpSetting } from "./dlpSetting";

export interface DlpGroupConfig {
  name: string;
  status?: boolean;
  _delete?: string[];
  sensors?: DlpSetting[];
  replace?: DlpSetting[];
}
