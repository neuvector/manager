import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ChartDataUpdate, ComponentChartData } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { Chart, ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  standalone: false,
  selector: 'app-container-stats',
  templateUrl: './container-stats.component.html',
  styleUrls: ['./container-stats.component.scss'],
})
export class ContainerStatsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;
  totalPoints = 30;
  cpuChartData!: ChartConfiguration<'line', number[], string>;
  byteChartData!: ChartConfiguration<'line', number[], string>;
  sessionChartData!: ChartConfiguration<'line', number[], string>;
  cpuData!: ComponentChartData;
  byteData!: ComponentChartData;
  sessionData!: ComponentChartData;

  constructor(private utils: UtilsService, private tr: TranslateService) {}

  ngOnInit(): void {
    this.initData();
    this.cpuChartData = this.getCPUConfig();
    this.byteChartData = this.getByteConfig();
    this.sessionChartData = this.getSessionConfig();
  }

  ngAfterViewInit(): void {
    this.refreshCharts();
  }

  ngOnDestroy(): void {
    if (this.charts) this.charts.forEach(child => child.chart?.destroy());
  }

  initData(): void {
    this.cpuData = {
      labels: Array(this.totalPoints).fill(''),
      y: Array(this.totalPoints).fill(0),
      y1: Array(this.totalPoints).fill(0),
    };
    this.byteData = {
      labels: Array(this.totalPoints).fill(''),
      y: Array(this.totalPoints).fill(0),
      y1: Array(this.totalPoints).fill(0),
    };
    this.sessionData = {
      labels: Array(this.totalPoints).fill(''),
      y: Array(this.totalPoints).fill(0),
      y1: Array(this.totalPoints).fill(0),
    };
  }

  clearCharts(): void {
    this.initData();
    this.utils.resetChart(this.cpuChartData, this.cpuData);
    this.utils.resetChart(this.byteChartData, this.byteData);
    this.utils.resetChart(this.sessionChartData, this.sessionData);
    this.refreshCharts();
  }

  refreshCharts(): void {
    if (this.charts) {
      this.charts.forEach(child => child.chart?.update());
    } else {
      console.log('charts uninitialized');
    }
  }

  updateCharts(
    cpu: ChartDataUpdate,
    byte: ChartDataUpdate,
    session: ChartDataUpdate
  ) {
    this.utils.updateChart(this.cpuChartData, cpu);
    this.utils.updateChart(this.byteChartData, byte);
    this.utils.updateChart(this.sessionChartData, session);
    this.charts.forEach(child => child.chart?.update());
  }

  getCPUConfig(): ChartConfiguration<'line', number[], string> {
    const cpuPostFix = (value, forLabel?) => {
      if ((value * 100) % 1 === 0 || forLabel) {
        return value + '%';
      }
      return '';
    };
    const memoryPostFix = (value, forLabel?) => {
      value = Number(value);
      if ((value * 100) % 1 === 0 || forLabel) {
        if (value < 1000) {
          return Math.abs(value) + 'MB';
        } else if (value < 1000 * 1000 && value >= 1000) {
          const gb = Math.abs(Math.round((value / 1000) * 10) / 10);
          return gb < 10 && gb % 1 !== 0
            ? gb.toFixed(1) + 'GB'
            : Math.round(gb) + 'GB';
        } else if (value < 1000 * 1000 * 1000 && value >= 1000 * 1000) {
          const tb = Math.abs(Math.round((value / 1000 / 1000) * 10) / 10);
          return tb < 10 && tb % 1 !== 0
            ? tb.toFixed(1) + 'TB'
            : Math.round(tb) + 'TB';
        }
      }
      return '';
    };
    return {
      type: 'line',
      options: {
        maintainAspectRatio: false,
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              generateLabels(chart) {
                const labels =
                    Chart.defaults.plugins.legend.labels.generateLabels(chart),
                  cpu =
                    chart.data.datasets[0].data[
                      chart.data.datasets[0].data.length - 1
                    ],
                  memory =
                    chart.data.datasets[1].data[
                      chart.data.datasets[1].data.length - 1
                    ];
                labels[0].text = `${labels[0].text}: ${cpuPostFix(cpu, true)}`;
                labels[1].text = `${labels[1].text}: ${memoryPostFix(
                  memory,
                  true
                )}`;
                return labels;
              },
            },
          },
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            grid: {
              display: false,
            },
            beginAtZero: true,
            ticks: {
              callback: cpuPostFix,
            },
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: {
              display: false,
            },
            beginAtZero: true,
            ticks: {
              callback: memoryPostFix,
            },
          },
        },
      },
      data: {
        labels: this.cpuData.labels,
        datasets: [
          {
            label: this.tr.instant('enforcers.stats.CPU'),
            data: this.cpuData.y,
            yAxisID: 'y',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.2,
          },
          {
            label: this.tr.instant('enforcers.stats.MEMORY'),
            data: this.cpuData.y1,
            yAxisID: 'y1',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.2,
          },
        ],
      },
    };
  }

  getByteConfig(): ChartConfiguration<'line', number[], string> {
    const bytePostFix = (value, forLabel?) => {
      value = Number(value);
      if (value % 1 === 0 || forLabel) {
        if (value < 1000) {
          return value + 'kB';
        } else if (value < 1000 * 1000 && value >= 1000) {
          return Math.round(value / 1000) + 'MB';
        } else if (value < 1000 * 1000 * 1000 && value >= 1000 * 1000) {
          return Math.round(value / 1000 / 1000) + 'GB';
        } else if (
          value < 1000 * 1000 * 1000 * 1000 &&
          value >= 1000 * 1000 * 1000
        ) {
          return Math.round(value / 1000 / 1000 / 1000) + 'TB';
        }
      }
      return '';
    };
    return {
      type: 'line',
      options: {
        maintainAspectRatio: false,
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              generateLabels(chart) {
                const labels =
                    Chart.defaults.plugins.legend.labels.generateLabels(chart),
                  input =
                    chart.data.datasets[0].data[
                      chart.data.datasets[0].data.length - 1
                    ],
                  output =
                    chart.data.datasets[1].data[
                      chart.data.datasets[1].data.length - 1
                    ];
                labels[0].text = `${labels[0].text}: ${bytePostFix(
                  input,
                  true
                )}`;
                labels[1].text = `${labels[1].text}: ${bytePostFix(
                  output,
                  true
                )}`;
                return labels;
              },
            },
          },
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            grid: {
              display: false,
            },
            beginAtZero: true,
            ticks: {
              callback: bytePostFix,
            },
          },
        },
      },
      data: {
        labels: this.byteData.labels,
        datasets: [
          {
            label: this.tr.instant('enforcers.stats.INCOMING_BYTES'),
            data: this.byteData.y,
            yAxisID: 'y',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.2,
          },
          {
            label: this.tr.instant('enforcers.stats.OUTGOING_BYTES'),
            data: this.byteData.y1,
            yAxisID: 'y',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.2,
          },
        ],
      },
    };
  }

  getSessionConfig(): ChartConfiguration<'line', number[], string> {
    const sessionPostFix = (value, forLabel?) => {
      value = Number(value);
      if (value % 1 === 0 || forLabel) {
        if (value < 1000) {
          return value;
        } else if (value < 1000 * 1000 && value >= 1000) {
          return Math.round(value / 1000) + 'k';
        } else if (value < 1000 * 1000 * 1000 && value >= 1000 * 1000) {
          return Math.round(value / 1000 / 1000) + 'M';
        } else if (
          value < 1000 * 1000 * 1000 * 1000 &&
          value >= 1000 * 1000 * 1000
        ) {
          return Math.round(value / 1000 / 1000 / 1000) + 'G';
        }
      }
      return '';
    };
    return {
      type: 'line',
      options: {
        maintainAspectRatio: false,
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: {
              generateLabels(chart) {
                const labels =
                    Chart.defaults.plugins.legend.labels.generateLabels(chart),
                  input =
                    chart.data.datasets[0].data[
                      chart.data.datasets[0].data.length - 1
                    ],
                  output =
                    chart.data.datasets[1].data[
                      chart.data.datasets[1].data.length - 1
                    ];
                labels[0].text = `${labels[0].text}: ${sessionPostFix(
                  input,
                  true
                )}`;
                labels[1].text = `${labels[1].text}: ${sessionPostFix(
                  output,
                  true
                )}`;
                return labels;
              },
            },
          },
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            grid: {
              display: false,
            },
            beginAtZero: true,
            ticks: {
              callback: sessionPostFix,
            },
          },
        },
      },
      data: {
        labels: this.sessionData.labels,
        datasets: [
          {
            label: this.tr.instant('enforcers.stats.INCOMING_SESSIONS'),
            data: this.sessionData.y,
            yAxisID: 'y',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.2,
          },
          {
            label: this.tr.instant('enforcers.stats.OUTGOING_SESSIONS'),
            data: this.sessionData.y1,
            yAxisID: 'y',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.2,
          },
        ],
      },
    };
  }
}
