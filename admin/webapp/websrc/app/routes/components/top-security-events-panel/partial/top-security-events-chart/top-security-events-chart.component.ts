import { Component, OnInit, Input, SecurityContext } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CapitalizePipe } from '@common/pipes/app.pipes';

@Component({
  selector: 'app-top-security-events-chart',
  templateUrl: './top-security-events-chart.component.html',
  styleUrls: ['./top-security-events-chart.component.scss']
})
export class TopSecurityEventsChartComponent implements OnInit {

  @Input() topSecurityEvents: any;
  @Input() direction: string;
  topSecurityEventsHorizontalBarChartConfig: any; //ChartConfiguration<'bar', number[], string[]>;

  constructor(
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private capitalizePipe: CapitalizePipe
  ) { }

  ngOnInit(): void {
    this.drawTopSecurityEventsHorizontalBarChart(this.topSecurityEvents, this.direction);
  }

  drawTopSecurityEventsHorizontalBarChart = (topSecurityEvents: any, direction: string) => {
    let topSecurityEventsLabels: Array<string> = new Array(5);
    let topSecurityEventsData: Array<number> = new Array(5);
    let barChartColors: Array<string> = new Array(5);
    let barChartBorderColors: Array<string> = new Array(5);
    topSecurityEventsLabels.fill('');
    topSecurityEventsData.fill(0);
    barChartColors.fill('rgba(239, 83, 80, 0.3)');
    barChartBorderColors.fill('#ef5350');
    topSecurityEvents[direction].forEach((workloadEvents, index) => {
      topSecurityEventsLabels[index] = this.sanitizer.sanitize(SecurityContext.HTML, workloadEvents[0][`${direction}_workload_name`])!;
      topSecurityEventsData[index] = workloadEvents.length;
    });
    console.log("topSecurityEventsLabels", topSecurityEventsLabels, topSecurityEventsData, barChartColors)
    this.topSecurityEventsHorizontalBarChartConfig = {
      type: 'bar',
      data: {
        labels: topSecurityEventsLabels,
        datasets: [{
          axis: 'y',
          label: `Top Security Events - ${this.capitalizePipe.transform(direction)}`,
          data: topSecurityEventsData,
          fill: false,
          backgroundColor: barChartColors,
          borderColor: barChartBorderColors,
          hoverBackgroundColor: barChartColors,
          hoverBorderColor: barChartBorderColors,
          barThickness: 15,
          borderWidth: 2
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false
      }
    };

  };
}
