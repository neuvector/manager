import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { DashboardService } from '@services/dashboard.service';
import {
  SystemSummaryDetails,
  RbacStatus,
  InternalSystemInfo,
} from '@common/types';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DashboardSecurityEventsService } from './thread-services/dashboard-security-events.service';
import { DashboardDetailsService } from './thread-services/dashboard-details.service';
import { DashboardExposureConversationsService } from './thread-services/dashboard-exposure-conversations.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Router } from '@angular/router';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { ReportByNamespaceModalComponent } from './report-by-namespace-modal/report-by-namespace-modal.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  isGlobalUser: boolean = false;
  summaryInfo!: SystemSummaryDetails;
  rbacInfo!: RbacStatus;
  scoreInfo!: InternalSystemInfo;
  isPrinting: boolean = false;
  iskube: boolean = false;
  reportDialog!: MatDialogRef<any>;
  reportDomain: string = "";
  reportInfo: any;
  private _switchClusterSubscriber;
  @ViewChild('dashboardReport') printableReport!: ElementRef;

  constructor(
    private dashboardService: DashboardService,
    private dashboardSecurityEventsService: DashboardSecurityEventsService,
    public dashboardDetailsService: DashboardDetailsService,
    private dashboardExposureConversationsService: DashboardExposureConversationsService,
    private multiClusterService: MultiClusterService,
    private router: Router,
    private assetsHttpService: AssetsHttpService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isGlobalUser = GlobalVariable.user?.global_permissions.length > 0;
    this.getBasicInfo();
    this.dashboardService.refreshEvent$.subscribe(refresh => {
      if (refresh) this.getBasicInfo();
    });
    this.dashboardSecurityEventsService.runWorker();
    this.dashboardDetailsService.runWorker();

    this._switchClusterSubscriber =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        const currentUrl = this.router.url;
        this.router
          .navigateByUrl('/', { skipLocationChange: true })
          .then(() => {
            this.router.navigate([currentUrl]);
          });
      });
  }

  ngOnDestroy(): void {
    this.dashboardSecurityEventsService.terminateWorker();
    this.dashboardDetailsService.terminateWorker();
    this.dashboardExposureConversationsService.terminateWorker();
    if (this._switchClusterSubscriber) {
      this._switchClusterSubscriber.unsubscribe();
    }
  }

  getBasicInfo = () => {
    this.dashboardService.getBasicData(this.isGlobalUser).subscribe(
      (response: any) => {
        this.summaryInfo = GlobalVariable.summary as SystemSummaryDetails;
        this.rbacInfo = response[0] as RbacStatus;
        this.scoreInfo = response[1] as InternalSystemInfo;
        console.log(
          'summaryInfo',
          this.summaryInfo,
          'rbacInfo',
          this.rbacInfo,
          'scoreInfo',
          this.scoreInfo
        );
        this.dashboardExposureConversationsService.runWorker(
          this.isGlobalUser,
          this.scoreInfo
        );
        this.iskube = this.summaryInfo.platform.toLowerCase().includes(GlobalConstant.KUBE);
      },
      error => {
        //TODO better error handling
        console.log('error', error);
      }
    );
  };

  openDashboardReportList = () => {
    this.assetsHttpService.getDomain()
      .subscribe(
        (response: any) => {
          const RESOURCELIST = ["_images", "_nodes", "_containers"];
          let domainList = response.domains.filter(
            (domain) => !RESOURCELIST.includes(domain.name)
          ).map(domain => domain.name);
          this.getDashboardReportListModal(domainList);
        },
        error => {
          console.warn(error);
          this.getDashboardReportListModal([]);
        }
      )

  };


  printDashboardReport = (domain: string = '', reportInfo: any = null) => {
    this.reportInfo = domain ? reportInfo :
    {
      scoreInfo: this.scoreInfo,
      summaryInfo: this.summaryInfo,
      dashboardSecurityEventInfo: {
        topSecurityEvents: this.dashboardSecurityEventsService.topSecurityEvents,
        securityEventSummary: this.dashboardSecurityEventsService.securityEventSummary
      },
      dashboardDetailsInfo: {
        isAutoScanOn: this.dashboardDetailsService.isAutoScanOn,
        highPriorityVulnerabilities: this.dashboardDetailsService.highPriorityVulnerabilities,
        containers: this.dashboardDetailsService.containers,
        services: this.dashboardDetailsService.services,
        applications: this.dashboardDetailsService.applications
      }
    };

    this.reportDialog.close();
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


  private getDashboardReportListModal = (domainList: string[]) => {
    this.reportDialog = this.dialog.open(ReportByNamespaceModalComponent, {
      width: '300px',
      data: {
        domainList: domainList,
        printDashboardReport: this.printDashboardReport,
        isGlobalUser: this.isGlobalUser
      },
      hasBackdrop: false,
      position: { right: '25px', top: '80px' },
    });
  };
}
