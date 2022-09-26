import { Component, Input, OnInit } from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { ScoreImprovementModalService } from '@services/score-improvement-modal.service';

@Component({
  selector: 'app-score-improvement-completed-view',
  templateUrl: './score-improvement-completed-view.component.html',
  styleUrls: ['./score-improvement-completed-view.component.scss'],
})
export class ScoreImprovementCompletedViewComponent implements OnInit {
  @Input() isGlobalUser!: boolean;
  get score() {
    let score = this.scoreImprovementModalService.score;
    const metrics = this.getGaugeMetrics(score);
    this.gaugeLabel = metrics.gaugeLabel;
    this.gaugeLabelColor = metrics.gaugeLabelColor;
    return score;
  }
  fixedScore!: number;
  gaugeLabel = '';
  gaugeLabelColor = '';
  gaugeLabelFixed = '';
  gaugeLabelColorFixed = '';
  title!: string;
  statement!: string;
  textClass!: string;

  constructor(
    private scoreImprovementModalService: ScoreImprovementModalService,
    private utils: UtilsService,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.getFixedScores();
  }

  getFixedScores() {
    if (!GlobalVariable.hasInitializedSummary) {
      console.warn('Summary uninitialized');
    }
    this.scoreImprovementModalService
      .getScores(this.isGlobalUser, GlobalVariable.summary.running_pods, null)
      .subscribe(scoreInfo => {
        this.fixedScore = scoreInfo.score.securityRiskScore;
        const metrics = this.getGaugeMetrics(this.fixedScore);
        this.gaugeLabelFixed = metrics.gaugeLabel;
        this.gaugeLabelColorFixed = metrics.gaugeLabelColor;
        this.setText(this.fixedScore);
      });
  }

  setText(finalScore: number) {
    const isGoodScore = finalScore <= 20;
    this.textClass = isGoodScore ? 'text-success' : 'text-warning';
    this.title = isGoodScore
      ? this.tr.instant(
          'dashboard.improveScoreModal.summary.conclusion.CONGRATS'
        )
      : this.tr.instant(
          'dashboard.improveScoreModal.summary.conclusion.WARNING'
        );
    if (this.scoreImprovementModalService.score === this.fixedScore) {
      this.statement = isGoodScore
        ? this.tr.instant(
            'dashboard.improveScoreModal.summary.noChangeRemind.CONGRATS_STATE'
          )
        : this.tr.instant(
            'dashboard.improveScoreModal.summary.noChangeRemind.WARNING_STATE'
          );
    } else {
      this.statement = isGoodScore
        ? this.tr.instant(
            'dashboard.improveScoreModal.summary.conclusion.CONGRATS_STATE'
          )
        : this.tr.instant(
            'dashboard.improveScoreModal.summary.conclusion.WARNING_STATE'
          );
    }
  }

  getGaugeMetrics = (score: number) => {
    let gaugeMetrics = this.utils.getGaugeMetrics(score);
    return gaugeMetrics;
  };

  getGaugeColor = (score: number) => {
    return this.getGaugeMetrics(score).gaugeLabelColor;
  };
}
