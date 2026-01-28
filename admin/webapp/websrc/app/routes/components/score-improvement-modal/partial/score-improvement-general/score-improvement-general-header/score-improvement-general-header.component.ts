import { Component, OnInit, Input } from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';
import { ScoreImprovementModalService } from '@services/score-improvement-modal.service';

@Component({
  standalone: false,
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
  gaugeColor = '';

  constructor(
    private scoreImprovementModalService: ScoreImprovementModalService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    let gaugeMetrics = this.utils.getGaugeMetrics(this.score);
    this.gaugeLabel = gaugeMetrics.gaugeLabel;
    this.gaugeLabelColor = gaugeMetrics.gaugeLabelColor;
    this.gaugeColor = gaugeMetrics.gaugeLabelColor;
  }
}
