import { Component, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { threeWayMerge } from '@common/utils/common.utils';


@Component({
  standalone: false,
  selector: 'app-security-events-chart',
  templateUrl: './security-events-chart.component.html',
  styleUrls: ['./security-events-chart.component.scss'],
  
})
export class SecurityEventsChartComponent implements OnInit {
  @Input() securityEventSummary: any;
  @Input() isReport: boolean = false;
  securityEventsChartConfig: any;
  noChartData: boolean = false;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.drawSecurityEventsLineChart();
  }

  drawSecurityEventsLineChart = () => {
    let securityEventsLabels = threeWayMerge(
      this.securityEventSummary.critical,
      this.securityEventSummary.warning,
      [],
      0,
      0
    );

    let labelListLength: number = securityEventsLabels.length;
    let criticalTotal: number = 0;
    let warningTotal: number = 0;
    let criticalDataList: Array<number> = new Array(labelListLength);
    let warningDataList: Array<number> = new Array(labelListLength);
    criticalDataList.fill(0);
    warningDataList.fill(0);
    this.securityEventSummary.critical.forEach(critical => {
      let index = securityEventsLabels.findIndex(
        label => label === critical[0]
      );
      criticalDataList[index] = critical[1];
      criticalTotal += critical[1];
    });

    this.securityEventSummary.warning.forEach(warning => {
      let index = securityEventsLabels.findIndex(label => label === warning[0]);
      warningDataList[index] = warning[1];
      warningTotal += warning[1];
    });

    this.noChartData =
      criticalDataList.length === 0 && warningDataList.length === 0;
    this.securityEventsChartConfig = {
      type: 'line',
      data: {
        labels: securityEventsLabels,
        datasets: [
          {
            label: `${this.translate.instant(
              'enum.CRITICAL'
            )}: ${criticalTotal}`,
            data: criticalDataList,
            backgroundColor: 'rgba(239, 83, 80, 0.3)',
            borderColor: '#ef5350',
            hoverBackgroundColor: 'rgba(239, 83, 80, 0.3)',
            hoverBorderColor: '#ef5350',
            pointColor: '#ef5350',
            pointStrokeColor: '#ef5350',
            pointHighlightFill: '#ef5350',
            pointHighlightStroke: '#ef5350',
            tension: 0.2,
          },
          {
            label: `${this.translate.instant('enum.WARNING')}: ${warningTotal}`,
            data: warningDataList,
            backgroundColor: 'rgba(239, 83, 80, 0.3)',
            borderColor: '#ff9800',
            hoverBackgroundColor: 'rgba(239, 83, 80, 0.3)',
            hoverBorderColor: '#ff9800',
            pointColor: '#ff9800',
            pointStrokeColor: '#ff9800',
            pointHighlightFill: '#ff9800',
            pointHighlightStroke: '#ff9800',
            tension: 0.2,
          },
        ],
      },
      options: {
        animation: !this.isReport,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: value => {
                if (parseFloat(value as string) % 1 === 0) return value;
                return null;
              },
            },
          },
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 15,
              boxHeight: 15,
            },
          },
          title: {
            display: true,
            text: 'Security Events',
          },
        },
      },
    };
  };
}
