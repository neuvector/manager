import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-compliance-items-charts',
  templateUrl: './compliance-items-charts.component.html',
  styleUrls: ['./compliance-items-charts.component.scss'],
})
export class ComplianceItemsChartsComponent implements OnInit {
  @Input() complianceDist!: any;
  complianceSeverityDistChartData!: ChartConfiguration<
    'doughnut',
    number[],
    string[]
  >;
  complianceTargetDistChartData!: ChartConfiguration<
    'doughnut',
    number[],
    string[]
  >;

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.complianceTargetDistChartData = {
      options: {
        cutout: 60,
        elements: {
          arc: {
            borderWidth: 0,
          },
        },
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'point',
          },
          title: {
            display: true,
            text: this.translateService.instant(
              'cis.report.others.SEVERITY_DIS'
            ),
          },
          legend: {
            display: true,
            labels: {
              boxWidth: 12,
            },
          },
        },
      },
      data: {
        labels: [
          ['Error'],
          ['High'],
          ['Warning'],
          ['Note'],
          ['Info'],
          ['Pass'],
        ],
        datasets: [
          {
            hoverBackgroundColor: [
              '#f22d3a',
              '#ef5350',
              '#ff9800',
              '#ffb661',
              '#36A2EB',
              '#6A8E6D',
            ],
            backgroundColor: [
              '#f22d3a',
              '#ef5350',
              '#ff9800',
              '#ffb661',
              '#36A2EB',
              '#6A8E6D',
            ],
            data: [
              this.complianceDist.error,
              this.complianceDist.high,
              this.complianceDist.warning,
              this.complianceDist.note,
              this.complianceDist.info,
              this.complianceDist.pass,
            ],
          },
        ],
      },
      type: 'doughnut',
    };

    this.complianceSeverityDistChartData = {
      options: {
        cutout: 60,
        elements: {
          arc: {
            borderWidth: 0,
          },
        },
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'point',
          },
          title: {
            display: true,
            text: this.translateService.instant('cis.report.others.TARGET_DIS'),
          },
          legend: {
            display: true,
            labels: {
              boxWidth: 12,
            },
          },
        },
      },
      data: {
        labels: [['Platform'], ['Image'], ['Node'], ['Container']],
        datasets: [
          {
            hoverBackgroundColor: ['#f22d3a', '#86aec2', '#4D5360', '#36A2EB'],
            backgroundColor: ['#f22d3a', '#86aec2', '#4D5360', '#36A2EB'],
            data: [
              this.complianceDist.platform,
              this.complianceDist.image,
              this.complianceDist.node,
              this.complianceDist.container,
            ],
          },
        ],
      },
      type: 'doughnut',
    };
  }
}
