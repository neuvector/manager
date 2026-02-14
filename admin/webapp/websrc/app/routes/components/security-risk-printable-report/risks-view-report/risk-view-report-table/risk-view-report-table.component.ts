import { Component, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-risk-view-report-table',
  templateUrl: './risk-view-report-table.component.html',
  styleUrls: ['./risk-view-report-table.component.scss'],
})
export class RiskViewReportTableComponent {
  @Input() data: any;
  @Input() reportPage: string;
  @Input() includesImpact: boolean;
  colourMap: any = MapConstant.colourMap;
  SEC_RISK_REPORT_MAX_ROW = MapConstant.SEC_RISK_REPORT_MAX_ROW;
  SEC_RISK_REPORT_NO_APPENDIX_MAX_ROW =
    MapConstant.SEC_RISK_REPORT_NO_APPENDIX_MAX_ROW;

  constructor() {}
}
