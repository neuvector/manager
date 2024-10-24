import { AdmissionRuleOptionSubOptions } from './admissionRuleOptionSubOptions';

export interface AdmissionRuleOption {
  name: string;
  ops: string[];
  values?: string[];
  match_src?: string;
  sub_options?: AdmissionRuleOptionSubOptions;
}
