import { AwsFuncSummary } from "./awsFuncSummary";

export interface AwsLambdaResDetail {
  status: string;
  func_list: AwsFuncSummary[];
}
