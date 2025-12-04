import { Component, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';


@Component({
  standalone: false,
  selector: 'app-risk-view-report-package-table',
  templateUrl: './risk-view-report-package-table.component.html',
  styleUrls: ['./risk-view-report-package-table.component.scss'],
  
})
export class RiskViewReportPackageTableComponent {
  @Input() packageVersions: any[];
  SEC_RISK_REPORT_MAX_DISPLAY_VERSION =
    MapConstant.SEC_RISK_REPORT_MAX_DISPLAY_VERSION;

  constructor() {}
}
