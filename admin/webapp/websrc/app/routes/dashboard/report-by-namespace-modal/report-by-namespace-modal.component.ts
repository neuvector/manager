import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DashboardService } from '@common/services/dashboard.service';

@Component({
  standalone: false,
  selector: 'app-report-by-namespace-modal',
  templateUrl: './report-by-namespace-modal.component.html',
  styleUrls: ['./report-by-namespace-modal.component.scss'],
})
export class ReportByNamespaceModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<ReportByNamespaceModalComponent>,
    private dashboardService: DashboardService
  ) {}

  printDashboardReportByDomain = (domain: string) => {
    this.dashboardService
      .getDomainReportData(this.data.isGlobalUser, domain)
      .subscribe(
        ([
          scoreInfo,
          dashboardSecurityEvent,
          dashboardDetails,
          summaryInfo,
        ]: any[]) => {
          let reportInfo = {
            scoreInfo: scoreInfo,
            summaryInfo: summaryInfo,
            dashboardSecurityEventInfo: {
              topSecurityEvents:
                dashboardSecurityEvent.criticalSecurityEvents
                  .top_security_events,
              securityEventSummary:
                dashboardSecurityEvent.criticalSecurityEvents.summary,
            },
            dashboardDetailsInfo: {
              isAutoScanOn: dashboardDetails.autoScanConfig,
              highPriorityVulnerabilities:
                dashboardDetails.highPriorityVulnerabilities,
              containers: dashboardDetails.containers,
              services: dashboardDetails.services,
              applications: dashboardDetails.applications2,
            },
          };
          setTimeout(() => {
            this.data.printDashboardReport(domain, reportInfo);
          }, 1000);
        }
      );
  };

  isOverflow(el: HTMLElement): boolean {
    return el.scrollWidth > el.clientWidth;
  }
}
