export interface AdmissionStats {
  k8s_allowed_requests: number;
  k8s_denied_requests: number;
  k8s_erroneous_requests: number;
  k8s_ignored_requests: number;
  jenkins_allowed_requests: number;
  jenkins_denied_requests: number;
  jenkins_erroneous_requests: number;
}
