import { Component, OnInit, Input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-security-events-printable-report-chart',
  templateUrl: './security-events-printable-report-chart.component.html',
  styleUrls: ['./security-events-printable-report-chart.component.scss'],
})
export class SecurityEventsPrintableReportChartComponent implements OnInit {
  @Input() statisticData: any;
  barChartConfig!: any;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    const TYPE_BAR_COLORS = ['#E91E63', '#EF5350', '#FF9800', '#29B6F6'];
    const TYPE_BAR_LABELS = ['Error', 'Critical', 'Warning', 'Info'];
    let dataMap = {
      Error: this.statisticData.get('Error'),
      Critical: this.statisticData.get('Critical'),
      Warning: this.statisticData.get('Warning'),
      Info: this.statisticData.get('Info'),
    };
    this.barChartConfig = {
      type: 'bar',
      data: {
        labels: TYPE_BAR_LABELS,
        datasets: [
          {
            axis: 'y',
            label: 'Security Events by Type',
            data: Array.from(Object.values(dataMap)),
            fill: false,
            backgroundColor: TYPE_BAR_COLORS,
            borderColor: TYPE_BAR_COLORS,
            hoverBackgroundColor: TYPE_BAR_COLORS,
            hoverBorderColor: TYPE_BAR_COLORS,
            barThickness: 15,
            borderWidth: 2,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  }
}
