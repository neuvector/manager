import { AdminRuleTypeOptions } from './adminRuleTypeOptions';
import { AdmissionState } from './admissionState';

export interface AdmissionConfigData {
  state?: AdmissionState;
  admission_options?: AdminRuleTypeOptions;
  k8s_env: boolean;
}
