import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { DashboardService } from '@services/dashboard.service';
import { SystemSummaryDetails, InternalSystemInfo } from '@common/types';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { ReportByNamespaceModalComponent } from './report-by-namespace-modal/report-by-namespace-modal.component';
import { isAuthorized } from '@common/utils/common.utils';
import { SummaryService } from '@services/summary.service';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('dashboardReport') printableReport!: ElementRef;

  isGlobalUser: boolean = false;
  summaryInfo!: SystemSummaryDetails;
  scoreInfo!: InternalSystemInfo | null;
  isPrinting: boolean = false;
  iskube: boolean = false;
  reportDialog!: MatDialogRef<any>;
  reportDomain: string = '';
  reportInfo: any;
  isShowingScore: boolean = false;

  securityEvents: any;
  details: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dashboardService: DashboardService,
    private assetsHttpService: AssetsHttpService,
    private summaryService: SummaryService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.securityEvents = this.activatedRoute.snapshot.data['securityEvents'];
    this.dashboardService
      .getDashboardDetails()
      .subscribe(d => (this.details = d));

    const resource = {
      seeScore: {
        global: 1,
        namespace: 1,
      },
    };
    this.isShowingScore = isAuthorized(
      GlobalVariable.user.roles,
      resource.seeScore
    );
    this.isGlobalUser = GlobalVariable.user?.global_permissions.length > 0;
    this.getBasicData();
    this.dashboardService.refreshEvent$.subscribe(refresh => {
      if (refresh) this.getBasicData(true);
    });

    if (!GlobalVariable.hasInitializedSummary) {
      this.getSummary();
    }
  }

  ngOnDestroy(): void {
    GlobalVariable.hasInitializedSummary = false;
  }

  openDashboardReportList = () => {
    this.assetsHttpService.getDomain().subscribe(
      (response: any) => {
        const RESOURCELIST = ['_images', '_nodes', '_containers'];
        let domainList = response.domains
          .filter(domain => !RESOURCELIST.includes(domain.name))
          .map(domain => domain.name);
        this.getDashboardReportListModal(domainList);
      },
      error => {
        console.warn(error);
        this.getDashboardReportListModal([]);
      }
    );
  };

  printDashboardReport = (domain: string = '', reportInfo: any = null) => {
    this.reportInfo = domain
      ? reportInfo
      : {
          scoreInfo: this.scoreInfo,
          summaryInfo: this.summaryInfo,
          dashboardSecurityEventInfo: {
            topSecurityEvents:
              this.securityEvents.criticalSecurityEvents['top_security_events'],
            securityEventSummary:
              this.securityEvents.criticalSecurityEvents['summary'],
          },
          dashboardDetailsInfo: {
            isAutoScanOn: this.details.autoScanConfig,
            highPriorityVulnerabilities:
              this.details.highPriorityVulnerabilities,
            containers: this.details.containers,
            services: this.details.services,
            applications: this.details.applications2,
          },
        };

    this.reportDialog?.close();

    setTimeout(() => {
      this.reportDomain = domain;
      this.isPrinting = true;
      setInterval(() => {
        if (this.printableReport) {
          window.print();
          this.isPrinting = false;
        }
      }, 500);
    }, 500);
  };

  private getBasicData = (isRefeshing = false) => {
    if (!isRefeshing) {
      const response = this.activatedRoute.snapshot.data['basicData'];
      this.handleBasicData(response);
    } else {
      this.dashboardService
        .getScoreData(GlobalVariable.user?.global_permissions.length > 0, null)
        .subscribe(this.handleBasicData.bind(this));
    }
  };

  private handleBasicData(response: InternalSystemInfo) {
    this.scoreInfo = null;
    this.summaryInfo = GlobalVariable.summary as SystemSummaryDetails;
    this.scoreInfo = response as InternalSystemInfo;

    this.iskube = this.summaryInfo.platform
      .toLowerCase()
      .includes(GlobalConstant.KUBE);
  }

  private getDashboardReportListModal = (domainList: string[]) => {
    this.reportDialog = this.dialog.open(ReportByNamespaceModalComponent, {
      width: '300px',
      data: {
        domainList: domainList,
        printDashboardReport: this.printDashboardReport,
        isGlobalUser: this.isGlobalUser,
      },
      hasBackdrop: false,
      position: { right: '25px', top: '80px' },
    });
  };

  private getSummary = () => {
    this.summaryService.refreshSummary();
  };
}
