import { Component, OnInit } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { DashboardService } from '@services/dashboard.service';
import {
  SystemSummaryDetails,
  RbacStatus,
  InternalSystemInfo,
} from '@common/types';
import { DashboardSecurityEventsService } from './thread-services/dashboard-security-events.service';
import { DashboardDetailsService } from './thread-services/dashboard-details.service';
import { DashboardExposureConversationsService } from './thread-services/dashboard-exposure-conversations.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Router } from '@angular/router';

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
  private _switchClusterSubscriber;

  constructor(
    private dashboardService: DashboardService,
    private dashboardSecurityEventsService: DashboardSecurityEventsService,
    public dashboardDetailsService: DashboardDetailsService,
    private dashboardExposureConversationsService: DashboardExposureConversationsService,
    private multiClusterService: MultiClusterService,
    private router: Router
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
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
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
      },
      error => {}
    );
  };
}
