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
  ErrorResponse,
  Platform,
  Vulnerability,
  VulnerabilityProfile,
} from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { isVulAccepted } from '@common/utils/common.utils';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { VulnerabilitiesGridComponent } from '@components/vulnerabilities-grid/vulnerabilities-grid.component';
import { VulnerabilityDetailDialogComponent } from '@components/vulnerabilities-grid/vulnerability-detail-dialog/vulnerability-detail-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { ScanService } from '@services/scan.service';
import { VersionInfoService } from '@services/version-info.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-platform-details',
  templateUrl: './platform-details.component.html',
  styleUrls: ['./platform-details.component.scss'],
})
export class PlatformDetailsComponent implements OnInit {
  private _platform!: Platform;
  @Input() gridHeight!: number;
  @Input() set platform(value: Platform) {
    this._platform = value;
    this.showAcceptedVuls = false;
    this.loadVuls();
  }
  get platform() {
    return this._platform;
  }
  @ViewChild(VulnerabilitiesGridComponent)
  vulGrid!: VulnerabilitiesGridComponent;
  @ViewChild(VulnerabilityDetailDialogComponent)
  vulDetails!: VulnerabilityDetailDialogComponent;
  selectedVulnerability!: Vulnerability;
  platformVuls!: Vulnerability[];
  vulEmpty: boolean = true;
  filter = new FormControl('');
  showAcceptedVuls: boolean = false;
  isVulsAuthorized!: boolean;
  isWriteVulsAuthorized!: boolean;
  selectedVulScore: String = 'V3';

  constructor(
    public versionInfoService: VersionInfoService,
    private quickFilterService: QuickFilterService,
    private notificationService: NotificationService,
    private scanService: ScanService,
    private authUtils: AuthUtilsService,
    private datePipe: DatePipe,
    private utils: UtilsService,
    private tr: TranslateService,
    private cd: ChangeDetectorRef
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

  loadVuls(): void {
    let scanReport: Observable<Vulnerability[]> =
      this.scanService.getPlatformVuls(
        this.platform.platform,
        this.showAcceptedVuls
      );
    scanReport.subscribe({
      next: vuls => {
        this.versionInfoService.setVersionInfo(
          this.platform,
          'vulnerabilities'
        );
        this.platformVuls = vuls;
        this.vulEmpty = !(vuls && vuls.length);
      },
      error: ({ error }: { error: ErrorResponse }) => {},
    });
  }

  isAccepted(vulnerability: Vulnerability): boolean {
    return isVulAccepted(vulnerability);
  }

  toggleAcceptedVuls(): void {
    this.showAcceptedVuls = !this.showAcceptedVuls;
    this.loadVuls();
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
            this.platform.platform
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
        this.platformVuls = [...this.platformVuls];
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
      this.utils.exportCVE(this.platform.platform, vulnerabilities4Csv);
    }
  }

  get activeScore() {
    return this.selectedVulScore === 'V2'
      ? this.tr.instant('scan.gridHeader.SCORE_V2')
      : this.tr.instant('scan.gridHeader.SCORE_V3');
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
