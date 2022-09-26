export interface DlpSensor {
  cfg_type: string;
  comment: string;
  groups: Array<string>;
  name: string;
  predefine: boolean;
  rules: Array<DlpRule>;
  isAllowed?: boolean;
}

export interface DlpRule {
  id: number;
  cfg_type: string;
  name: string;
  patterns: Array<DlpPattern>;
}

export interface DlpPattern {
  context: string;
  key: string;
  op: string;
  value: string;
}

export interface DlpSetting {
  name: string;
  action: string;
  comment?: string;
  cfg_type?: string;
  exist?: boolean;
  predefine: boolean;
}

export interface DlpGroup {
  name: string;
  cfg_type?: string;
  status: boolean;
  sensors: DlpSetting[];
}
