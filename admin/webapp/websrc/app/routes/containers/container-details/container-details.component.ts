import { DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ErrorResponse,
  ProcessInfo,
  Vulnerability,
  VulnerabilityProfile,
  WorkloadCompliance,
} from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { isVulAccepted } from '@common/utils/common.utils';
import { ComplianceGridComponent } from '@components/compliance-grid/compliance-grid.component';
import { ContainerStatsComponent } from '@components/container-stats/container-stats.component';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { VulnerabilitiesGridComponent } from '@components/vulnerabilities-grid/vulnerabilities-grid.component';
import { VulnerabilityDetailDialogComponent } from '@components/vulnerabilities-grid/vulnerability-detail-dialog/vulnerability-detail-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { ContainersService, WorkloadRow } from '@services/containers.service';
import { NotificationService } from '@services/notification.service';
import { ScanService } from '@services/scan.service';
import { VersionInfoService } from '@services/version-info.service';
import { Observable, of, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

export const containerDetailsTabs = {
  0: 'details',
  1: 'compliance',
  2: 'vulnerabilities',
  3: 'process',
  4: 'stats',
};

@Component({
  standalone: false,
  selector: 'app-container-details',
  templateUrl: './container-details.component.html',
  styleUrls: ['./container-details.component.scss'],
})
export class ContainerDetailsComponent implements OnInit, OnDestroy {
  private _container!: WorkloadRow;
  @Input() gridHeight!: number;
  @Input() set container(value: WorkloadRow) {
    this._container = value;
    this.showAcceptedVuls = false;
    if (this.containerStats) {
      this.containerStats.clearCharts();
    }
    this.activateTab({ index: this.activeTabIndex });
  }
  get container() {
    return this._container;
  }
  @ViewChild(ComplianceGridComponent) complianceGrid!: ComplianceGridComponent;
  @ViewChild(VulnerabilitiesGridComponent)
  vulGrid!: VulnerabilitiesGridComponent;
  @ViewChild(ContainerStatsComponent) containerStats!: ContainerStatsComponent;
  containerCompliance!: WorkloadCompliance;
  containerVuls!: Vulnerability[];
  containerProcess!: ProcessInfo[];
  @ViewChild(VulnerabilityDetailDialogComponent)
  vulDetails!: VulnerabilityDetailDialogComponent;
  selectedVulnerability!: Vulnerability;
  activeControllerSub!: Subscription | null;
  complianceEmpty: boolean = true;
  vulEmpty: boolean = true;
  activeTabIndex: number = 0;
  filter = new FormControl('');
  showProcessHistory: boolean = false;
  @ViewChild('processHistoryTooltip') processHistoryTooltip!: MatTooltip;
  showAcceptedVuls: boolean = false;
  @ViewChild('acceptedTooltip') acceptedTooltip!: MatTooltip;
  isVulsAuthorized!: boolean;
  isWriteVulsAuthorized!: boolean;
  selectedVulScore: String = 'V3';
  get processHistoryMsg() {
    return !this.showProcessHistory
      ? this.tr.instant('containers.process.SHOW_EXITED')
      : this.tr.instant('containers.process.HIDE_EXITED');
  }
  get acceptedVulsMsg() {
    return this.showAcceptedVuls
      ? this.tr.instant('enum.HIDE_ACCEPTED_VULS')
      : this.tr.instant('enum.SHOW_ACCEPTED_VULS');
  }
  get showFilter(): boolean {
    return ['compliance', 'vulnerabilities', 'process'].includes(
      this.activeTab
    );
  }
  get activeTab(): string {
    return containerDetailsTabs[this.activeTabIndex];
  }
  get visibleIcons() {
    const acceptVul = !!(
      this.isVulsAuthorized &&
      this.isWriteVulsAuthorized &&
      this.selectedVulnerability &&
      !this.isAccepted(this.selectedVulnerability)
    );
    const toggleVul = this.isVulsAuthorized;
    const csv = !this.vulEmpty;
    return +acceptVul + +toggleVul + +csv;
  }
  get activeScore() {
    return this.selectedVulScore === 'V2'
      ? this.tr.instant('scan.gridHeader.SCORE_V2')
      : this.tr.instant('scan.gridHeader.SCORE_V3');
  }

  constructor(
    private containersService: ContainersService,
    private scanService: ScanService,
    private quickFilterService: QuickFilterService,
    private versionInfoService: VersionInfoService,
    private tr: TranslateService,
    private cd: ChangeDetectorRef,
    private authUtils: AuthUtilsService,
    private utils: UtilsService,
    private notificationService: NotificationService,
    private datePipe: DatePipe
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

  ngOnDestroy(): void {
    this.clearStatsSub();
  }

  loadCompliance(container: WorkloadRow) {
    this.containersService
      .getContainerCompliance(container.brief.id)
      .subscribe({
        next: compliance => {
          this.versionInfoService.setVersionInfo(compliance, 'compliance');
          this.containerCompliance = compliance;
          this.complianceEmpty = !(compliance.items && compliance.items.length);
        },
        error: ({ error }: { error: ErrorResponse }) => {
          console.error(error);
          this.containerCompliance = { items: [] } as any;
          this.complianceEmpty = true;
        },
      });
  }

  loadVuls(container: WorkloadRow) {
    let scanReport: Observable<Vulnerability[]>;
    if (container.brief.state === 'exit') {
      scanReport = of([]);
    } else {
      scanReport = this.scanService.getContainerVuls(
        container.brief.id,
        this.showAcceptedVuls
      );
    }
    scanReport.subscribe({
      next: vuls => {
        this.versionInfoService.setVersionInfo(container, 'vulnerabilities');
        this.containerVuls = vuls;
        this.vulEmpty = !(vuls && vuls.length);
      },
      error: ({ error }: { error: ErrorResponse }) => {
        console.error(error);
        this.containerVuls = [];
        this.vulEmpty = true;
      },
    });
  }

  loadProcess(container: WorkloadRow) {
    this.containersService
      .getContainerProcess(container.brief.id, this.showProcessHistory)
      .subscribe({
        next: process => {
          this.containerProcess = process;
        },
        error: ({ error }: { error: ErrorResponse }) => {
          console.error(error);
          this.containerProcess = [];
        },
      });
  }

  clearStatsSub(): void {
    if (this.activeControllerSub && !this.activeControllerSub.closed) {
      this.activeControllerSub.unsubscribe();
      this.activeControllerSub = null;
    }
  }

  getStats(container: WorkloadRow) {
    this.clearStatsSub();
    this.activeControllerSub = this.containersService
      .startContainerStats(container.brief.id)
      .subscribe({
        next: ({ cpu, byte, session }) => {
          if (this.containerStats)
            this.containerStats.updateCharts(cpu, byte, session);
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.tr.instant('general.UNFORMATTED_ERR')
          );
        },
      });
  }

  isAccepted(vulnerability: Vulnerability): boolean {
    return isVulAccepted(vulnerability);
  }

  toggleAcceptedVuls(): void {
    this.showAcceptedVuls = !this.showAcceptedVuls;
    this.acceptedTooltip.show();
    this.loadVuls(this.container);
  }

  toggleProcessHistory(): void {
    this.showProcessHistory = !this.showProcessHistory;
    this.processHistoryTooltip.show();
    this.loadProcess(this.container);
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
            this.container.brief.display_name
          } at ${this.datePipe.transform(
            new Date(),
            'MMM dd, y HH:mm:ss'
          )} from Containers page`,
          images: [this._container.brief.image],
          domains: [this.container.brief.domain],
        },
      ],
      name: 'default',
    };
    this.scanService.acceptVulnerability(payload).subscribe({
      complete: () => {
        this.notificationService.open(this.tr.instant('cveProfile.msg.ADD_OK'));
        if (!vulnerability.tags) vulnerability.tags = [];
        vulnerability.tags.push('accepted');
        if (this.showAcceptedVuls) {
          this.containerVuls = [...this.containerVuls];
        } else {
          this.containerVuls = this.containerVuls.filter(
            v => v !== vulnerability
          );
        }
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
      this.utils.exportCVE(
        this.container.brief.display_name,
        vulnerabilities4Csv
      );
    }
  }

  activateTab(event): void {
    if (this.activeTabIndex === 4) {
      this.clearStatsSub();
    }
    this.activeTabIndex = event.index;
    switch (this.activeTabIndex) {
      case 1:
        this.loadCompliance(this.container);
        break;
      case 2:
        this.loadVuls(this.container);
        break;
      case 3:
        this.loadProcess(this.container);
        break;
      case 4:
        this.getStats(this.container);
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
