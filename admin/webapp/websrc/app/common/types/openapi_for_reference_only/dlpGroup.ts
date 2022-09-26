import { DlpSetting } from "./dlpSetting";

export interface DlpGroup {
  name: string;
  status: boolean;
  sensors: DlpSetting[];
}
