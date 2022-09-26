import { Injectable } from '@angular/core';
import { EventsHttpService } from '@common/api/events-http.service';
import { Audit } from '@common/types';
import { uuid } from '@common/utils/common.utils';
import { map } from 'rxjs/operators';

export type AuditRow = Audit & {
  id: string;
  parent_id?: string;
  child_id?: string;
  visible: boolean;
};

@Injectable()
export class RiskReportsService {
  private _riskReports: Audit[] = [];
  get riskReports() {
    return this._riskReports;
  }
  set riskReports(riskReports: Audit[]) {
    this._riskReports = riskReports;
  }

  private _displayReports: AuditRow[] = [];
  get displayReports() {
    return this._displayReports;
  }
  set displayReports(displayReports: AuditRow[]) {
    this._displayReports = displayReports;
  }

  constructor(private eventsHttpService: EventsHttpService) {}

  resetReports() {
    this._riskReports = [];
    this._displayReports = [];
  }

  getRiskReports() {
    return this.eventsHttpService.getRiskReports().pipe(
      map(riskReports => {
        return riskReports.filter(audit => {
          const valid = !!audit.name;
          if (!valid) {
            console.warn(
              'Invalid risk report data from controller was found.',
              audit
            );
          }
          return valid;
        });
      })
    );
  }

  formatReports(reports: Audit[]): AuditRow[] {
    let res: AuditRow[] = [];
    reports.forEach(report => {
      const parent_id = uuid();
      if (this.doesReportFlower(report)) {
        const child_id = uuid();
        res.push({ id: parent_id, child_id, ...report, visible: false });
        res.push({
          id: child_id,
          parent_id,
          ...report,
          visible: false,
        });
      } else {
        res.push({ id: parent_id, ...report, visible: true });
      }
    });
    return res;
  }

  doesReportFlower(report: Audit) {
    return (
      (report.name.toLowerCase().includes('compliance') &&
        report.items &&
        report.items.length > 0) ||
      report.name.toLowerCase().includes('scan') ||
      report.name.toLowerCase().includes('admission')
    );
  }
}
