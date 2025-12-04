import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { ComponentChartData, Controller, ErrorResponse } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { Chart, ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { SystemComponentsCommunicationService } from '../system-components-communication.service';


@Component({
  standalone: false,
  selector: 'app-controller-details',
  templateUrl: './controller-details.component.html',
  styleUrls: ['./controller-details.component.scss'],
  
})
export class ControllerDetailsComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;
  @ViewChild('detailsTabGroup', { static: false })
  detailsTabGroup!: MatTabGroup;
  activeTabIndex: number = 0;
  currentController!: Controller | undefined;
  totalPoints = 30;
  cpuChartData!: ChartConfiguration<'line', number[], string>;
  cpuData!: ComponentChartData;
  get isDisconnected() {
    return this.currentController?.connection_state === 'disconnected';
  }
  get statsSub() {
    return this.componentsCommunicationService.systemComponentStats.controller;
  }
  set statsSub(sub: Subscription | null) {
    this.componentsCommunicationService.systemComponentStats.controller = sub;
  }

  constructor(
    private componentsCommunicationService: SystemComponentsCommunicationService,
    private tr: TranslateService,
    private utils: UtilsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initTabs();
    this.initData();
    this.cpuChartData = this.getCPUConfig();
    this.componentsCommunicationService.selectedController$.subscribe(
      controller => {
        this.currentController = controller;
        if (!this.currentController) return;
        this.clearCharts();
        if (this.activeTabIndex === 1 && this.chart.chart) {
          this.getStats();
        }
      }
    );
  }

  ngAfterViewInit(): void {
    this.refreshChart();
  }

  ngOnDestroy(): void {
    this.clearStatsSub();
  }

  initTabs() {
    this.activeTabIndex = 0;
    if (this.detailsTabGroup) {
      this.detailsTabGroup.selectedIndex = this.activeTabIndex;
      this.detailsTabGroup.realignInkBar();
    }
  }

  initData(): void {
    this.cpuData = {
      labels: Array(this.totalPoints).fill(''),
      y: Array(this.totalPoints).fill(0),
      y1: Array(this.totalPoints).fill(0),
    };
  }

  refreshChart(): void {
    if (this.chart) {
      this.chart.chart?.update();
    }
  }

  clearCharts(): void {
    this.initData();
    this.utils.resetChart(this.cpuChartData, this.cpuData);
    this.refreshChart();
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
            label: this.tr.instant('controllers.stats.CPU'),
            data: this.cpuData.y,
            yAxisID: 'y',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.2,
          },
          {
            label: this.tr.instant('controllers.stats.MEMORY'),
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

  clearStatsSub(): void {
    if (this.statsSub && !this.statsSub.closed) {
      this.statsSub.unsubscribe();
      this.statsSub = null;
    }
  }

  getStats(): void {
    this.clearStatsSub();
    if (this.currentController && !this.isDisconnected) {
      this.statsSub = this.componentsCommunicationService
        .startControllerStats(this.currentController)
        // .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: cpu => {
            this.utils.updateChart(this.cpuChartData, cpu);
            this.refreshChart();
          },
          error: ({ error }: { error: ErrorResponse }) => {
            this.notificationService.openError(
              error,
              this.tr.instant('general.UNFORMATTED_ERR')
            );
          },
        });
    }
  }

  activateTab(event): void {
    this.activeTabIndex = event.index;
    switch (this.activeTabIndex) {
      case 0:
        this.clearStatsSub();
        break;
      case 1:
        this.getStats();
        break;
    }
  }
}
