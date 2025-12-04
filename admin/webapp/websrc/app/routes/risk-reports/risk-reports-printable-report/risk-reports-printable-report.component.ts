import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { Audit } from '@common/types';
import { groupBy } from '@common/utils/common.utils';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-risk-reports-printable-report',
  templateUrl: './risk-reports-printable-report.component.html',
  styleUrls: ['./risk-reports-printable-report.component.scss'],
})
export class RiskReportsPrintableReportComponent {
  private _riskReports!: Audit[];
  @Input() set riskReports(audits: Audit[]) {
    const filtered = audits
      .sort((a, b) => Date.parse(a.reported_at) - Date.parse(b.reported_at))
      .slice(0, GlobalConstant.REPORT_SIZE.RISK_REPORT)
      .reverse();
    this._riskReports = filtered;
    this.summaryRangeMsg = this.getSummaryRange(
      audits.length,
      this.riskReports.length
    );
    this.genDistribution();
  }
  get riskReports() {
    return this._riskReports;
  }
  severityDistribution!: Map<string, number>;
  scanDistribution!: Map<string, number>;
  summaryRangeMsg!: string;

  constructor(private tr: TranslateService, private datePipe: DatePipe) {}

  textClass(level: string) {
    if (['error', 'critical'].includes(level.toLowerCase())) {
      return 'text-danger';
    }
    return `text-${level.toLowerCase()}`;
  }

  mapEntries(map: Map<string, number>) {
    return Array.from(map.entries());
  }

  getSummaryRange(count: number, filteredCount: number) {
    const start = this.riskReports[this.riskReports.length - 1].reported_at;
    const end = this.riskReports[0].reported_at;
    return this.tr.instant('general.PDF_SUMMARY_RANGE_FILTERED', {
      from: this.datePipe.transform(start, 'MMM dd, y HH:mm:ss'),
      to: this.datePipe.transform(end, 'MMM dd, y HH:mm:ss'),
      rangedCount: `${count} ${this.tr.instant('audit.COUNT_POSTFIX')}`,
      filteredCount: filteredCount,
    });
  }

  genDistribution() {
    const severityDistribution = new Map([
      ['Info', 0],
      ['Warning', 0],
      ['Error', 0],
      ['Critical', 0],
    ]);
    this.riskReports.forEach(audit => {
      if (!severityDistribution.has(audit.level)) {
        severityDistribution.set(audit.level, 1);
      } else {
        severityDistribution.set(
          audit.level,
          severityDistribution.get(audit.level)! + 1
        );
      }
    });
    this.severityDistribution = new Map(
      [...severityDistribution]
        .filter(a => a[1])
        .sort((a, b) => a[1] - b[1])
        .reverse()
    );
    const scanSummary = groupBy(this.riskReports, 'name');
    const scanDistribution = new Map();
    for (let item in scanSummary) {
      scanDistribution.set(item, scanSummary[item].length);
    }
    this.scanDistribution = new Map(
      [...scanDistribution]
        .filter(a => a[1])
        .sort((a, b) => a[1] - b[1])
        .reverse()
    );
    console.log(this.severityDistribution, this.scanDistribution);
  }
}
