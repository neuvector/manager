export interface AwsFuncSummary {
  function_id: string;
  version: string;
  function_name: string;
  scan_result: string;
  high: number;
  medium: number;
  permission_level: string;
  status: string;
}
