import { Component, OnInit, Input, SecurityContext } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CapitalizePipe } from '@common/pipes/app.pipes';
import { ChartConfiguration } from 'chart.js';


@Component({
  standalone: false,
  selector: 'app-top-security-events-chart',
  templateUrl: './top-security-events-chart.component.html',
  styleUrls: ['./top-security-events-chart.component.scss'],
  
})
export class TopSecurityEventsChartComponent implements OnInit {
  @Input() topSecurityEvents: any;
  @Input() direction!: string;
  @Input() isReport: boolean = false;
  topSecurityEventsHorizontalBarChartConfig: ChartConfiguration<
    'bar',
    number[],
    string
  >;
  noChartData: boolean = false;

  constructor(
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private capitalizePipe: CapitalizePipe
  ) {}

  ngOnInit(): void {
    this.drawTopSecurityEventsHorizontalBarChart(
      this.topSecurityEvents,
      this.direction
    );
  }

  drawTopSecurityEventsHorizontalBarChart = (
    topSecurityEvents: any,
    direction: string
  ) => {
    let topSecurityEventsLabels: Array<string> = new Array(5);
    let topSecurityEventsData: Array<number> = new Array(5);
    let barChartColors: Array<string> = new Array(5);
    let barChartBorderColors: Array<string> = new Array(5);
    topSecurityEventsLabels.fill('');
    topSecurityEventsData.fill(0);
    barChartColors.fill('rgba(239, 83, 80, 0.3)');
    barChartBorderColors.fill('#ef5350');
    topSecurityEvents[direction].forEach((workloadEvents, index) => {
      topSecurityEventsLabels[index] = this.sanitizer.sanitize(
        SecurityContext.HTML,
        workloadEvents[0][`${direction}_workload_name`]
      )!;
      topSecurityEventsData[index] = workloadEvents.length;
    });
    this.noChartData =
      topSecurityEventsData.reduce((prev, curr) => prev + curr) === 0;
    this.topSecurityEventsHorizontalBarChartConfig = {
      type: 'bar',
      data: {
        labels: topSecurityEventsLabels,
        datasets: [
          {
            label: `${this.translate.instant(
              'dashboard.body.panel_title.TOP_SEC_EVENTS'
            )} - ${this.capitalizePipe.transform(direction)}`,
            data: topSecurityEventsData,
            backgroundColor: barChartColors,
            borderColor: barChartBorderColors,
            hoverBackgroundColor: barChartColors,
            hoverBorderColor: barChartBorderColors,
            barThickness: 15,
            borderWidth: 2,
          },
        ],
      },
      options: {
        animation: false,
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              callback: value => {
                if (parseFloat(value as string) % 1 === 0) return value;
                return null;
              },
            },
          },
          y: {
            ticks: {
              crossAlign: 'far',
              callback: function (value, index, values): string {
                let label = this.getLabelForValue(value as number);
                return label.length > 22
                  ? `${label.substring(0, 22)}...`
                  : label;
              },
            },
          },
        },
      },
    };
  };
}
