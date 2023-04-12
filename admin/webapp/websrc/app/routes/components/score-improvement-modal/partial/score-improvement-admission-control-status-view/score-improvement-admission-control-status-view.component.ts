import { Component, Input, OnInit } from '@angular/core';
import { ScoreImprovementModalService } from '@services/score-improvement-modal.service';

@Component({
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
    const metrics = JSON.parse(JSON.stringify(this.scoreImprovementModalService.newMetrics()))
    metrics.deny_adm_ctrl_rules = 1;
    this.scoreImprovementModalService
      .calculateScoreData(
        metrics,
        this.isGlobalUser,
        this.scoreImprovementModalService.scoreInfo.header_data.workloads.running_pods
      )
      .subscribe(scores => {
        this.projectedScore = scores.securityRiskScore;
      });
  }
}
