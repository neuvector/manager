import { ScanAwsFuncReportReqResources } from "./scanAwsFuncReportReqResources";
import { ScanAwsFuncReportAllowedResources } from "./scanAwsFuncReportAllowedResources";
import { ScanAwsFuncDetail } from "./scanAwsFuncDetail";

export interface ScanAwsFuncReport {
  function_id: string;
  nv_sec_id: string;
  version: string;
  scan_result: ScanAwsFuncDetail;
  allowed_resources: ScanAwsFuncReportAllowedResources;
  req_resources: ScanAwsFuncReportReqResources;
}
