import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-risks-view-report',
  templateUrl: './risks-view-report.component.html',
  styleUrls: ['./risks-view-report.component.scss'],
})
export class RisksViewReportComponent implements OnInit {
  @Input() reportPage: string = '';
  @Input() withoutAppendix: boolean = false;
  @Input() data: any;
  @Input() charts: any;
  @Input() isMeetingReportLimit: boolean;
  @Input() filterService: any;
  @Input() view!: string;
  Array = Array;
  SEC_RISK_REPORT_NO_APPENDIX_MAX_ROW =
    MapConstant.SEC_RISK_REPORT_NO_APPENDIX_MAX_ROW;
  SEC_RISK_REPORT_MAX_ROW = MapConstant.SEC_RISK_REPORT_MAX_ROW;
  isNameSpaceFiltered: boolean = false;

  constructor() {}

  ngOnInit(): void {
    if (typeof this.isMeetingReportLimit === 'undefined') {
      this.isMeetingReportLimit =
        this.data.length > this.SEC_RISK_REPORT_MAX_ROW;
    }

    if (this.reportPage === 'vulnerabilities') {
      this.isNameSpaceFiltered =
        (this.filterService.vulQuerySubject$.value.selectedDomains ?? [])
          .length > 0;
    } else {
      this.isNameSpaceFiltered =
        (this.filterService.advFilter.selectedDomains ?? []).length > 0;
    }
  }
}
