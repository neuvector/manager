import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BytesPipe } from '@common/pipes/app.pipes';
import { Chart, LogarithmicScale } from 'chart.js';

@Component({
  standalone: false,
  selector: 'app-application-volume-chart',
  templateUrl: './application-volume-chart.component.html',
  styleUrls: ['./application-volume-chart.component.scss'],
})
export class ApplicationVolumeChartComponent implements OnInit, OnDestroy {
  @Input() applications: any;
  @Input() isReport: boolean = false;
  applicationVolumeBarChartConfig: any;
  noChartData: boolean = false;

  constructor(
    private translate: TranslateService,
    private bytesPipe: BytesPipe
  ) {}

  ngOnInit(): void {
    Chart.register(LogarithmicScale);
    this.drawApplicationVolumeBarChart(this.applications);
  }

  ngOnDestroy(): void {
    Chart.unregister(LogarithmicScale);
  }

  xAxisTickCb = (value, index, values) => {
    console.log(value, index, values);
    let ticks: Array<number> = [];
    ticks.push(0);
    ticks.push(Math.round(values[values.length - 1].value / 1000));
    ticks.push(Math.round(values[values.length - 1].value / 100));
    ticks.push(Math.round(values[values.length - 1].value / 10));
    ticks.push(Math.round(values[values.length - 1].value));
    console.log(ticks);
    return ticks.includes(value)
      ? this.bytesPipe.transform(value.toString())
      : undefined;
  };

  tooltipTitleCb = tooltipItems => {
    return this.bytesPipe.transform(tooltipItems[0].raw.toString());
  };

  tooltipLabelCb = tooltipItems => {
    console.log('label', tooltipItems);
    return tooltipItems.label;
  };

  drawApplicationVolumeBarChart = (applications: any) => {
    applications.sort((a, b) => b[1].totalBytes - a[1].totalBytes);
    let applicationVolumeLabel = applications.map(app => app[0]);
    let applicationVolumeData = applications.map(app => app[1].totalBytes);

    this.noChartData = applicationVolumeData.length === 0;
    this.applicationVolumeBarChartConfig = {
      options: {
        animation: !this.isReport,
        scales: {
          y: {
            type: 'logarithmic',
            stepSize: 1,
            ticks: {
              callback: this.xAxisTickCb.bind(this),
            },
            // afterBuildTicks: (pckBarChart) => {
            //   pckBarChart.ticks = [];
            //   pckBarChart.ticks.push('0');
            //   pckBarChart.ticks.push(
            //     this.bytesPipe.transform(Math.round(applicationVolumeData[0] / 1000).toString())
            //   );
            //   pckBarChart.ticks.push(
            //     this.bytesPipe.transform(Math.round(applicationVolumeData[0] / 100).toString())
            //   );
            //   pckBarChart.ticks.push(
            //     this.bytesPipe.transform(Math.round(applicationVolumeData[0] / 10).toString())
            //   );
            //   pckBarChart.ticks.push(
            //     this.bytesPipe.transform(Math.round(applicationVolumeData[0]).toString())
            //   );
            // },
          },
        },
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false,
            text: 'Application Volume',
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: this.tooltipTitleCb.bind(this),
              label: this.tooltipLabelCb.bind(this),
            },
          },
        },
      },
      data: {
        labels: applicationVolumeLabel,
        datasets: [
          {
            data: applicationVolumeData,
            backgroundColor: 'rgba(24, 109, 51, 0.3)',
            borderColor: '#186d33',
            hoverBackgroundColor: 'rgba(24, 109, 51, 0.3)',
            hoverBorderColor: '#186d33',
            borderWidth: 2,
          },
        ],
      },
      type: 'bar',
    };
  };
}
