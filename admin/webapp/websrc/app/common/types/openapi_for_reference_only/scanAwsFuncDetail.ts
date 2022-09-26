import { ScanReport } from "./scanReport";
import { ScanBrief } from "./scanBrief";

export interface ScanAwsFuncDetail {
  scan_brief: ScanBrief;
  scan_report: ScanReport;
}
