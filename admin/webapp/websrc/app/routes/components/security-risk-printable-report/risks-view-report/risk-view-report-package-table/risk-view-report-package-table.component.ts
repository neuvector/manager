import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  selector: 'app-risk-view-report-package-table',
  templateUrl: './risk-view-report-package-table.component.html',
  styleUrls: ['./risk-view-report-package-table.component.scss']
})
export class RiskViewReportPackageTableComponent implements OnInit {

  @Input() packageVersions: any[];
  SEC_RISK_REPORT_MAX_DISPLAY_VERSION = MapConstant.SEC_RISK_REPORT_MAX_DISPLAY_VERSION;

  constructor() { }

  ngOnInit(): void {
  }

}
