export interface AwsFuncSummary {
  function_id: string;
  version: string;
  function_name: string;
  scan_result: string;
  critical: number;
  high: number;
  medium: number;
  permission_level: string;
  status: string;
}
