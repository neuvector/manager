export interface GroupBrief {
  name: string;
  learned: boolean;
  reserved: boolean;
  policy_mode?: string;
  profile_mode?: string;
  not_scored: boolean;
  domain: string;
  creater_domains: string[];
  kind: string;
  platform_role: string;
  cfg_type: string;
  cap_change_mode?: boolean;
  cap_scorable?: boolean;
}
