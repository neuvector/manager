export interface PolicyRuleConfig {
  id: number;
  comment?: string;
  from?: string;
  to?: string;
  ports?: string;
  action?: string;
  applications?: string[];
  disable?: boolean;
  /**
   * CfgTypeLearned / CfgTypeUserCreated / CfgTypeGround / CfgTypeFederal
   */
  cfg_type: string;
  priority?: number;
}
