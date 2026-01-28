import { DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  Check,
  ErrorResponse,
  Host,
  Vulnerability,
  VulnerabilityProfile,
  Workload,
  WorkloadCompliance,
} from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { isVulAccepted } from '@common/utils/common.utils';
import { ComplianceGridComponent } from '@components/compliance-grid/compliance-grid.component';
import { RemediationDetailDialogComponent } from '@components/compliance-grid/remediation-detail-dialog/remediation-detail-dialog.component';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { VulnerabilitiesGridComponent } from '@components/vulnerabilities-grid/vulnerabilities-grid.component';
import { VulnerabilityDetailDialogComponent } from '@components/vulnerabilities-grid/vulnerability-detail-dialog/vulnerability-detail-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { ContainersService } from '@services/containers.service';
import { NodesService } from '@services/nodes.service';
import { NotificationService } from '@services/notification.service';
import { ScanService } from '@services/scan.service';
import { VersionInfoService } from '@services/version-info.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export const nodeDetailsTabs = {
  0: 'details',
  1: 'compliance',
  2: 'vulnerabilities',
  3: 'containers',
};

@Component({
  standalone: false,
  selector: 'app-node-details',
  templateUrl: './node-details.component.html',
  styleUrls: ['./node-details.component.scss'],
})
export class NodeDetailsComponent implements OnInit {
  private _node!: Host;
  @Input() gridHeight!: number;
  @Input() set node(value: Host) {
    this._node = value;
    this.showAcceptedVuls = false;
    this.activateTab({ index: this.activeTabIndex });
  }
  get node() {
    return this._node;
  }
  @ViewChild(ComplianceGridComponent) complianceGrid!: ComplianceGridComponent;
  @ViewChild(VulnerabilitiesGridComponent)
  vulGrid!: VulnerabilitiesGridComponent;
  activeTabIndex: number = 0;
  nodeCompliance!: WorkloadCompliance;
  nodeVuls!: Vulnerability[];
  nodeContainers!: Workload[];
  @ViewChild(VulnerabilityDetailDialogComponent)
  vulDetails!: VulnerabilityDetailDialogComponent;
  selectedVulnerability!: Vulnerability;
  @ViewChild(RemediationDetailDialogComponent)
  remediationDetails!: RemediationDetailDialogComponent;
  selectedRemediation!: Check;
  complianceEmpty: boolean = true;
  vulEmpty: boolean = true;
  filter = new FormControl('');
  showAcceptedVuls: boolean = false;
  showSysContainers: boolean = false;
  isVulsAuthorized!: boolean;
  isWriteVulsAuthorized!: boolean;
  selectedVulScore: String = 'V3';
  get sysContainersMsg() {
    return !this.showSysContainers
      ? this.tr.instant('nodes.containers.SHOW_SYS_NODE')
      : this.tr.instant('nodes.containers.HIDE_SYS_NODE');
  }
  get showFilter(): boolean {
    return ['compliance', 'vulnerabilities', 'containers'].includes(
      this.activeTab
    );
  }
  get activeTab(): string {
    return nodeDetailsTabs[this.activeTabIndex];
  }
  get activeScore() {
    return this.selectedVulScore === 'V2'
      ? this.tr.instant('scan.gridHeader.SCORE_V2')
      : this.tr.instant('scan.gridHeader.SCORE_V3');
  }

  constructor(
    private nodesService: NodesService,
    private versionInfoService: VersionInfoService,
    private scanService: ScanService,
    private containersService: ContainersService,
    private quickFilterService: QuickFilterService,
    private notificationService: NotificationService,
    private authUtils: AuthUtilsService,
    private datePipe: DatePipe,
    private utils: UtilsService,
    private cd: ChangeDetectorRef,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.filter.valueChanges
      .pipe(
        tap((value: string | null) =>
          this.quickFilterService.setTextInput(value || '')
        )
      )
      .subscribe();
    this.isVulsAuthorized = this.authUtils.getDisplayFlag('vuls_profile');
    this.isWriteVulsAuthorized =
      this.authUtils.getDisplayFlag('write_vuls_profile');
  }

  openRemediation(data: Check) {
    this.selectedRemediation = data;
    this.remediationDetails.show();
  }

  loadCompliance(node: Host) {
    this.nodesService.getNodeCompliance(node.id).subscribe({
      next: compliance => {
        this.versionInfoService.setVersionInfo(compliance, 'compliance');
        this.nodeCompliance = compliance;
        this.complianceEmpty = !(compliance.items && compliance.items.length);
      },
      error: ({ error }: { error: ErrorResponse }) => {},
    });
  }

  loadVuls(node: Host): void {
    let scanReport: Observable<Vulnerability[]> = this.scanService.getNodeVuls(
      node.id,
      this.showAcceptedVuls
    );
    scanReport.subscribe({
      next: vuls => {
        this.versionInfoService.setVersionInfo(node, 'vulnerabilities');
        this.nodeVuls = vuls;
        this.vulEmpty = !(vuls && vuls.length);
      },
      error: ({ error }: { error: ErrorResponse }) => {},
    });
  }

  loadContainers(node: Host): void {
    this.containersService.resetContainers();
    this.nodesService.getNodeContainers(node.id).subscribe({
      next: workloads => {
        this.nodeContainers = workloads;
        this.containersService.displayContainers =
          this.containersService.filterWorkload(
            this.showSysContainers,
            this.nodeContainers
          );
        console.log(this.containersService.displayContainers);
      },
      error: ({ error }: { error: ErrorResponse }) => {},
    });
  }

  isAccepted(vulnerability: Vulnerability): boolean {
    return isVulAccepted(vulnerability);
  }

  toggleAcceptedVuls(): void {
    this.showAcceptedVuls = !this.showAcceptedVuls;
    this.loadVuls(this.node);
  }

  toggleSysContainers(): void {
    this.showSysContainers = !this.showSysContainers;
    this.containersService.displayContainers =
      this.containersService.filterWorkload(
        this.showSysContainers,
        this.nodeContainers
      );
  }

  vulnerabilitySelected(vulnerability: Vulnerability): void {
    this.selectedVulnerability = vulnerability;
    this.vulDetails.show();
  }

  onAcceptVulnerability(vulnerability: Vulnerability): void {
    const payload: VulnerabilityProfile = {
      entries: [
        {
          name: vulnerability.name,
          days: 0,
          comment: `Vulnerability was accepted on ${
            this.node.name
          } at ${this.datePipe.transform(
            new Date(),
            'MMM dd, y HH:mm:ss'
          )} from Hosts page`,
          images: [],
          domains: [],
        },
      ],
      name: 'default',
    };
    this.scanService.acceptVulnerability(payload).subscribe({
      complete: () => {
        this.notificationService.open(this.tr.instant('cveProfile.msg.ADD_OK'));
        if (!vulnerability.tags) vulnerability.tags = [];
        vulnerability.tags.push('accepted');
        this.nodeVuls = [...this.nodeVuls];
        this.cd.detectChanges();
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.openError(
          error,
          this.tr.instant('cveProfile.msg.ADD_NG')
        );
      },
    });
  }

  exportCVE(): void {
    let vulnerabilities4Csv: Vulnerability[] = [];
    this.vulGrid.gridApi.forEachNodeAfterFilter(node =>
      vulnerabilities4Csv.push(node.data)
    );
    if (vulnerabilities4Csv.length) {
      this.utils.exportCVE(this.node.name, vulnerabilities4Csv);
    }
  }

  activateTab(event): void {
    this.activeTabIndex = event.index;
    switch (this.activeTabIndex) {
      case 1:
        this.loadCompliance(this.node);
        break;
      case 2:
        this.loadVuls(this.node);
        break;
      case 3:
        this.loadContainers(this.node);
        break;
    }
    if (![1, 2].includes(this.activeTabIndex))
      this.versionInfoService.setVersionInfo(null, '');
  }

  changeScoreView(val: string) {
    this.selectedVulScore = val;
    if (val === 'V2') {
      this.vulGrid.gridApi?.setColumnsVisible(['score_v3'], false);
      this.vulGrid.gridApi?.setColumnsVisible(['score'], true);
    } else {
      this.vulGrid.gridApi?.setColumnsVisible(['score'], false);
      this.vulGrid.gridApi?.setColumnsVisible(['score_v3'], true);
    }
    this.vulGrid.gridApi.sizeColumnsToFit();
    this.cd.markForCheck();
  }
}
