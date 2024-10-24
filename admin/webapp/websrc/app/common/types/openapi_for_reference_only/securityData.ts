import { Violation } from './violation';
import { Incident } from './incident';
import { Threat } from './threat';

export interface SecurityData {
  threats: Threat[];
  incidents: Incident[];
  violations: Violation[];
}
