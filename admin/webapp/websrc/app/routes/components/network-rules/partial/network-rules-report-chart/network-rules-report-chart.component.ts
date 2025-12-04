import { Component, OnInit, Input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-network-rules-report-chart',
  templateUrl: './network-rules-report-chart.component.html',
  styleUrls: ['./network-rules-report-chart.component.scss'],
})
export class NetworkRulesReportChartComponent implements OnInit {
  @Input() statisticData;
  pieChartData!: ChartConfiguration<'pie', number[], string[]>;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    const TYPE_PIE_COLORS = ['#45505c', '#ff8a65', '#e6e600', '#d2aff1'];
    const TYPE_PIE_LABELS = [
      this.translate.instant('policy.head.FED_RULE'),
      this.translate.instant('policy.head.GROUND_RULE'),
      this.translate.instant('policy.head.CUSTOMER_RULE'),
      this.translate.instant('policy.head.LEARN_RULE'),
    ];
    console.log('this.statisticData.values()', this.statisticData.values());
    this.pieChartData = {
      options: {
        animation: false,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false,
            text: this.translate.instant('policy.report.BY_TYPE'),
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
            data: Array.from(this.statisticData.values()),
          },
        ],
      },
      type: 'pie',
    };
  }
}
