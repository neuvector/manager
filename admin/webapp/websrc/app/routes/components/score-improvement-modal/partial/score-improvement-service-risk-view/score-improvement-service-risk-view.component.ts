import { Component, Input, OnInit } from '@angular/core';
import { ErrorResponse, Group, PolicyMode, Service } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { ServiceModeTypes } from '@routes/settings/configuration/config-form/config-form-config/constants';
import { NotificationService } from '@services/notification.service';
import { ScoreImprovementModalService } from '@services/score-improvement-modal.service';
import { SettingsService } from '@services/settings.service';

@Component({
  standalone: false,
  selector: 'app-score-improvement-service-risk-view',
  templateUrl: './score-improvement-service-risk-view.component.html',
  styleUrls: ['./score-improvement-service-risk-view.component.scss'],
})
export class ScoreImprovementServiceRiskViewComponent implements OnInit {
  @Input() isGlobalUser!: boolean;
  get score() {
    return this.scoreImprovementModalService.score;
  }
  projectedScore!: number;
  newServiceMode!: PolicyMode;
  newServiceProfileMode!: PolicyMode;
  selectedGroup!: Group | null;
  get serviceModes() {
    return ServiceModeTypes;
  }

  constructor(
    private scoreImprovementModalService: ScoreImprovementModalService,
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.getPredictionScores();
    this.getServiceMode();
  }

  getServiceMode() {
    this.settingsService.getConfig().subscribe(config => {
      this.newServiceMode = config.new_svc.new_service_policy_mode;
      this.newServiceProfileMode = config.new_svc.new_service_profile_mode;
    });
  }

  switchNewServiceMode(type) {
    this.settingsService
      .patchConfigServiceMode(
        type === 'network'
          ? {
              new_service_policy_mode: this.newServiceMode,
            }
          : {
              new_service_profile_mode: this.newServiceProfileMode,
            }
      )
      .subscribe({
        complete: () => {
          this.notificationService.open(this.tr.instant('setting.SUBMIT_OK'));
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.tr.instant('setting.SUBMIT_FAILED')
          );
        },
      });
  }

  getPredictionScores() {
    const metrics = JSON.parse(
      JSON.stringify(this.scoreImprovementModalService.newMetrics())
    );
    metrics.new_service_policy_mode = 'Protect';
    metrics.new_service_profile_mode = 'Protect';
    metrics.groups.protect_groups +=
      metrics.groups.discover_groups + metrics.groups.monitor_groups;
    metrics.groups.monitor_groups = 0;
    metrics.groups.discover_groups = 0;
    metrics.groups.profile_discover_groups = 0;
    metrics.groups.discover_groups_zero_drift = 0;
    this.scoreImprovementModalService
      .calculateScoreData(metrics)
      .subscribe(scores => {
        this.projectedScore = scores.security_scores.security_risk_score;
      });
  }

  setSelectedGroup(group: Group | Service | null) {
    this.selectedGroup = null;
    setTimeout(() => {
      this.selectedGroup = group as Group;
    });
  }
}
