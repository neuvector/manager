export interface PwdProfile {
  name: string;
  comment: string;
  min_len: number;
  min_uppercase_count: number;
  min_lowercase_count: number;
  min_digit_count: number;
  min_special_count: number;
  enable_password_expiration: boolean;
  password_expire_after_days: number;
  enable_password_history: number;
  password_keep_history_count: number;
  enable_block_after_failed_login: boolean;
  block_after_failed_login_count: number;
  block_minutes: number;
}
