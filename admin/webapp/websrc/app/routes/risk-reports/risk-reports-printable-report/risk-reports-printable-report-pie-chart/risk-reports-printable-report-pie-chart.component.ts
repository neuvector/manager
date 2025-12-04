import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartConfiguration } from 'chart.js';

@Component({
  standalone: false,
  selector: 'app-risk-reports-printable-report-pie-chart',
  templateUrl: './risk-reports-printable-report-pie-chart.component.html',
  styleUrls: ['./risk-reports-printable-report-pie-chart.component.scss'],
})
export class RiskReportsPrintableReportPieChartComponent {
  private _statisticData!: Map<string, number>;
  @Input() set statisticData(stats: Map<string, number>) {
    this._statisticData = stats;
    if (stats) this.genPieChart();
  }
  get statisticData() {
    return this._statisticData;
  }
  pieChartData!: ChartConfiguration<'pie', number[], string[]>;

  constructor(private tr: TranslateService) {}

  genPieChart() {
    const TYPE_PIE = [
      [this.tr.instant('enum.INFO'), '#2196f3'],
      [this.tr.instant('enum.WARNING'), '#ff9800'],
      [this.tr.instant('enum.ERROR'), '#e91e63'],
      [this.tr.instant('enum.CRITICAL'), '#dc4034'],
    ].filter(v => this.statisticData.has(v[0]));
    const TYPE_PIE_LABELS = TYPE_PIE.map(v => v[0]);
    const TYPE_PIE_COLORS = TYPE_PIE.map(v => v[1]);
    const TYPE_PIE_DATA = TYPE_PIE_LABELS.map(l =>
      this.statisticData.get(l)
    ) as number[];
    this.pieChartData = {
      options: {
        animation: {
          duration: 0,
        },
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.tr.instant('audit.report.chartTitleByLevel'),
          },
          legend: {
            display: true,
            position: 'bottom',
          },
        },
      },
      data: {
        labels: TYPE_PIE_LABELS,
        datasets: [
          {
            hoverBorderColor: TYPE_PIE_COLORS,
            hoverBackgroundColor: TYPE_PIE_COLORS,
            backgroundColor: TYPE_PIE_COLORS,
            data: TYPE_PIE_DATA,
          },
        ],
      },
      type: 'pie',
    };
  }
}
