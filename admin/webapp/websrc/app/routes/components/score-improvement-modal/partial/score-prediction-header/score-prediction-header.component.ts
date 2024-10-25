import { Component, Input } from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  selector: 'app-score-prediction-header',
  templateUrl: './score-prediction-header.component.html',
  styleUrls: ['./score-prediction-header.component.scss'],
})
export class ScorePredictionHeaderComponent {
  private _score!: number;
  private _projectedScore!: number;
  @Input() message!: string;
  @Input() set score(value: number) {
    this._score = value;
    const metrics = this.getGaugeMetrics(this.score);
    this.gaugeLabel = metrics.gaugeLabel;
    this.gaugeLabelColor = metrics.gaugeLabelColor;
  }
  get score() {
    return this._score;
  }
  @Input() set projectedScore(value: number) {
    this._projectedScore = value;
    const metrics = this.getGaugeMetrics(this.projectedScore);
    this.gaugeLabelProj = metrics.gaugeLabel;
    this.gaugeLabelColorProj = metrics.gaugeLabelColor;
  }
  get projectedScore() {
    return this._projectedScore;
  }
  gaugeLabel = '';
  gaugeLabelColor = '';
  gaugeLabelProj = '';
  gaugeLabelColorProj = '';

  constructor(private utils: UtilsService) {}

  getGaugeMetrics = (score: number) => {
    let gaugeMetrics = this.utils.getGaugeMetrics(score);
    return gaugeMetrics;
  };

  getGaugeColor = (score: number) => {
    return this.getGaugeMetrics(score).gaugeLabelColor;
  };
}
