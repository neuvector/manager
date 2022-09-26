export interface WafSensor {
  cfg_type: string;
  comment: string;
  groups: Array<string>;
  name: string;
  predefine: boolean;
  rules: Array<WafRule>;
  isAllowed?: boolean;
}

export interface WafRule {
  id: number;
  cfg_type: string;
  name: string;
  patterns: Array<WafPattern>;
}

export interface WafPattern {
  context: string;
  key: string;
  op: string;
  value: string;
}

export interface WafSetting {
  name: string;
  action: string;
  comment?: string;
  cfg_type?: string;
  exist?: boolean;
  predefine: boolean;
}

export interface WafGroup {
  name: string;
  cfg_type?: string;
  status: boolean;
  sensors: WafSetting[];
}
