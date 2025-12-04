import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartConfiguration } from 'chart.js';

@Component({
  standalone: false,
  selector: 'app-risk-reports-printable-report-bar-chart',
  templateUrl: './risk-reports-printable-report-bar-chart.component.html',
  styleUrls: ['./risk-reports-printable-report-bar-chart.component.scss'],
})
export class RiskReportsPrintableReportBarChartComponent {
  private _statisticData!: Map<string, number>;
  @Input() set statisticData(stats: Map<string, number>) {
    this._statisticData = stats;
    if (stats) this.genBarChart();
  }
  get statisticData() {
    return this._statisticData;
  }
  barChartData!: ChartConfiguration<'bar', number[], string[]>;

  constructor(private tr: TranslateService) {}

  genBarChart() {
    const TYPE_BAR_COLOR = '#ff9800';
    const TYPE_BAR_LABELS = [...this.statisticData.keys()] as any[];
    this.barChartData = {
      options: {
        animation: {
          duration: 0,
        },
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.tr.instant('audit.report.chartTitleByScanType'),
          },
          legend: {
            display: false,
          },
        },
      },
      data: {
        labels: TYPE_BAR_LABELS,
        datasets: [
          {
            hoverBorderColor: TYPE_BAR_COLOR,
            hoverBackgroundColor: TYPE_BAR_COLOR,
            backgroundColor: TYPE_BAR_COLOR,
            data: Array.from(this.statisticData.values()),
          },
        ],
      },
      type: 'bar',
    };
  }
}
