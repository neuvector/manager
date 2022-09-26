import { Component, OnInit, Input } from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';
import { ScoreImprovementModalService } from '@services/score-improvement-modal.service';

@Component({
  selector: 'app-score-improvement-general-header',
  templateUrl: './score-improvement-general-header.component.html',
  styleUrls: ['./score-improvement-general-header.component.scss'],
})
export class ScoreImprovementGeneralHeaderComponent implements OnInit {
  get score() {
    return this.scoreImprovementModalService.score;
  }
  gaugeLabel = '';
  gaugeLabelColor = '';

  constructor(
    private scoreImprovementModalService: ScoreImprovementModalService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.getGaugeColor(this.score);
  }

  getGaugeColor = (score: number) => {
    let gaugeMetrics = this.utils.getGaugeMetrics(score);
    this.gaugeLabel = gaugeMetrics.gaugeLabel;
    this.gaugeLabelColor = gaugeMetrics.gaugeLabelColor;
    return gaugeMetrics.gaugeLabelColor;
  };
}
