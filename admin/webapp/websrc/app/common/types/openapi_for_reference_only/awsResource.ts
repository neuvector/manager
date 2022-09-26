import { AwsLambdaRes } from "./awsLambdaRes";

export interface AwsResource {
  acc_id?: string;
  acc_key?: string;
  project_name: string;
  region_list: string[];
  aws_lambda_resource: AwsLambdaRes;
}
