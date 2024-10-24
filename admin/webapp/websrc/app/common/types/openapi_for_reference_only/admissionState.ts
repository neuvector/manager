import { AdmissionStateCtrlStates } from './admissionStateCtrlStates';
import { AdmissionStateAdmClientModeOptions } from './admissionStateAdmClientModeOptions';

export interface AdmissionState {
  enable?: boolean;
  mode?: string;
  default_action?: string;
  adm_client_mode?: string;
  adm_svc_type?: string;
  adm_client_mode_options?: AdmissionStateAdmClientModeOptions;
  ctrl_states?: AdmissionStateCtrlStates;
}
