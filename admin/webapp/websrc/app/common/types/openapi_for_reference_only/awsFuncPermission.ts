import { AwsFuncPermissionAllowedDetail } from './awsFuncPermissionAllowedDetail';

export interface AwsFuncPermission {
  aws_attached_policy: boolean;
  policy_permission_level: string;
  permission_state: string[];
  allowed_detail: AwsFuncPermissionAllowedDetail;
}
