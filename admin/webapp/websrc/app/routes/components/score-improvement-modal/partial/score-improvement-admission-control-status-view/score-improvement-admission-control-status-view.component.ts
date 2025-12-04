import { Component, Input, OnInit } from '@angular/core';
import { ScoreImprovementModalService } from '@services/score-improvement-modal.service';

@Component({
  standalone: false,
  selector: 'app-score-improvement-admission-control-status-view',
  templateUrl:
    './score-improvement-admission-control-status-view.component.html',
  styleUrls: [
    './score-improvement-admission-control-status-view.component.scss',
  ],
})
export class ScoreImprovementAdmissionControlStatusViewComponent
  implements OnInit
{
  @Input() isGlobalUser!: boolean;
  get score() {
    return this.scoreImprovementModalService.score;
  }
  projectedScore!: number;

  constructor(
    private scoreImprovementModalService: ScoreImprovementModalService
  ) {}

  ngOnInit(): void {
    this.getPredictionScores();
  }

  getPredictionScores() {
    const metrics = JSON.parse(
      JSON.stringify(this.scoreImprovementModalService.newMetrics())
    );
    metrics.adm_mode = 'protect';
    metrics.enabled_deny_adm_ctrl_rules = 1;
    metrics.deny_adm_ctrl_rules = 1;
    this.scoreImprovementModalService
      .calculateScoreData(metrics)
      .subscribe(scores => {
        this.projectedScore = scores.security_scores.security_risk_score;
      });
  }
}
