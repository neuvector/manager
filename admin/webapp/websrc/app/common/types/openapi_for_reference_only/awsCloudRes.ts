import { AwsLambdaRes } from './awsLambdaRes';

export interface AwsCloudRes {
  cloud_type: string;
  project_name: string;
  region_list: string[];
  aws_lambda_resource: AwsLambdaRes;
}
