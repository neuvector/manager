import { Component, OnInit, Input } from '@angular/core';
import {
  RiskFactor,
  SystemSummaryDetails,
  InternalSystemInfo,
} from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { ScoreImprovementModalComponent } from '@components/score-improvement-modal/score-improvement-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { DashboardService } from '@services/dashboard.service';

@Component({
  standalone: false,
  selector: 'app-security-risk-panel',
  templateUrl: './security-risk-panel.component.html',
  styleUrls: ['./security-risk-panel.component.scss'],
})
export class SecurityRiskPanelComponent implements OnInit {
  @Input() details: any;
  @Input() scoreInfo!: InternalSystemInfo;
  @Input() summaryInfo!: SystemSummaryDetails;

  riskFactorList: Array<RiskFactor> = new Array(3);
  activeIndex4RiskInstruction: number = 0;

  constructor(
    private dashboardService: DashboardService,
    private translate: TranslateService,
    private datePipe: DatePipe,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.makeRiskFactorData(this.scoreInfo, this.summaryInfo);
  }

  makeRiskFactorData = (
    scoreInfo: InternalSystemInfo,
    summaryInfo: SystemSummaryDetails
  ): void => {
    this.riskFactorList[0] = {
      factorTitle: this.translate.instant('dashboard.heading.SERVICE_CONN'),
      factors: [
        {
          title: this.translate.instant('dashboard.body.panel_title.DISCOVER'),
          amount: scoreInfo.metrics.groups.discover_groups.toString(),
          comment:
            scoreInfo.metrics.groups.discover_groups_zero_drift.toString(),
        },
        {
          title: this.translate.instant('dashboard.body.panel_title.MONITOR'),
          amount: scoreInfo.metrics.groups.monitor_groups.toString(),
          comment:
            scoreInfo.metrics.groups.monitor_groups_zero_drift.toString(),
        },
        {
          title: this.translate.instant('dashboard.body.panel_title.PROTECT'),
          amount: scoreInfo.metrics.groups.protect_groups.toString(),
          comment:
            scoreInfo.metrics.groups.protect_groups_zero_drift.toString(),
        },
      ],
      factorComment: [
        this.translate.instant('dashboard.heading.BASED_ON_POLICY_MODE'),
      ],
      subScore: {
        height: `${95 - scoreInfo.security_scores.service_mode_score_by_100}%`,
      },
      isFactorError: false,
    };

    this.riskFactorList[1] = {
      factorTitle: this.translate.instant('dashboard.heading.INGRESS_EGRESS'),
      factors: [
        {
          title: this.translate.instant('dashboard.body.panel_title.DISCOVER'),
          amount: scoreInfo.metrics.workloads.discover_ext_eps.toString(),
        },
        {
          title: this.translate.instant('dashboard.heading.THREATS'),
          amount: scoreInfo.metrics.workloads.threat_ext_eps.toString(),
        },
        {
          title: this.translate.instant('dashboard.heading.VIOLATIONS'),
          amount: scoreInfo.metrics.workloads.violate_ext_eps.toString(),
        },
      ],
      subScore: {
        height: `${95 - scoreInfo.security_scores.exposure_score_by_100}%`,
      },
      isFactorError: false,
    };

    this.riskFactorList[2] = {
      factorTitle: this.translate.instant('dashboard.heading.VUL_EXPLOIT_RISK'),
      factors: [
        {
          title: this.translate.instant('dashboard.body.panel_title.DISCOVER'),
          amount: scoreInfo.metrics.cves.discover_cves.toString(),
        },
        {
          title: this.translate.instant('dashboard.body.panel_title.MONITOR'),
          amount: scoreInfo.metrics.cves.monitor_cves.toString(),
        },
        {
          title: this.translate.instant('dashboard.body.panel_title.PROTECT'),
          amount: scoreInfo.metrics.cves.protect_cves.toString(),
        },
      ],
      factorComment: [
        `${this.translate.instant('dashboard.heading.CVE_DB_VERSION')}: ${
          summaryInfo.cvedb_version
        }`,
        `(${this.datePipe.transform(
          summaryInfo.cvedb_create_time,
          'MMM dd, y'
        )})`,
      ],
      subScore: {
        height: `${95 - scoreInfo.security_scores.vulnerability_score_by_100}%`,
      },
      isFactorError: false,
    };
  };

  openScoreImprovementConsole = () => {
    const scoreImpovementDialogRef = this.dialog.open(
      ScoreImprovementModalComponent,
      {
        data: {
          scoreInfo: this.scoreInfo,
        },

        panelClass: 'mat-dialog-container-full',
        width: '80vw',
        height: '685px',
      }
    );
    scoreImpovementDialogRef.afterClosed().subscribe(result => {
      this.dashboardService.refresh();
    });
  };

  mouseoverOnRiskScore = () => {
    this.activeIndex4RiskInstruction = 0;
  };

  mouseoverOnRiskFactor = (index: number) => {
    this.activeIndex4RiskInstruction = index + 1;
  };
}
