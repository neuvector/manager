export class AdmRuleSubCriterion {
  name: string = "";
  op: string = "";
  value: string = "";
  unit?: string;
}

export interface AdmRuleCriterion {
  sub_criteria?: Array<AdmRuleSubCriterion>;
  name: string;
  op?: string;
  value?: string;
}

export interface AdmissionRule {
  id?: number;
  category?: string;
  comment?: string;
  criteria?: Array<AdmRuleCriterion>;
  disable?: boolean;
  critical?: boolean;
  cfg_type?: string;
  rule_type?: string;
}

export interface AdmissionRules {
  rules: Array<AdmissionRule>;
}

interface AdmissionState {
  enable?: boolean;
  mode?: string;
  default_action?: string;
  adm_client_mode?: string;
  adm_svc_type?: string;
  failure_policy?: string;
  adm_client_mode_options?: {
    [key: string]: string[];
  };
  ctrl_states?: {
    [key: string]: boolean[];
  };
  cfg_type: string;
}

export interface AdmissionStateRec {
  k8s_env: boolean;
  state?: AdmissionState;
}

interface AdmissionTestResult {
  allowed: Boolean;
  index: number;
  kind: string;
  message: string;
  name: string;
}

export interface AdmissionConfigurationAssessment {
  props_unavailable: Array<string>;
  results: Array<AdmissionTestResult>;
}
