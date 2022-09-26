export interface BenchItem {
  catalog: string;
  type: string;
  level: string;
  test_number: string;
  profile: string;
  scored: boolean;
  automated: boolean;
  description: string;
  message: string[];
  remediation: string;
  group: string;
}
