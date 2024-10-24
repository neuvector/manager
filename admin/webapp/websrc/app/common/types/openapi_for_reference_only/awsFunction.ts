import { ScanAwsFuncReport } from './scanAwsFuncReport';

export interface AwsFunction {
  function_name: string;
  region: string;
  report?: ScanAwsFuncReport[];
}
