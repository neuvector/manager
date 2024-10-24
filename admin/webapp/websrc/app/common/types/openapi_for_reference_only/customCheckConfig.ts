import { CustomChecks } from './customChecks';

export interface CustomCheckConfig {
  add: CustomChecks;
  _delete: CustomChecks;
  update: CustomChecks;
}
