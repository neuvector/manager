import { Component, OnInit, Input } from '@angular/core';
import { HierarchicalExposure, ExposedContainer } from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { GlobalConstant } from '@common/constants/global.constant';


@Component({
  standalone: false,
  selector: 'app-exposure-chart',
  templateUrl: './exposure-chart.component.html',
  styleUrls: ['./exposure-chart.component.scss'],
  
})
export class ExposureChartComponent implements OnInit {
  @Input() ingress: Array<HierarchicalExposure> = [];
  @Input() egress: Array<HierarchicalExposure> = [];
  @Input() isReport: boolean = false;
  exposureChartConfig: any;
  chartNumbers: any;
  noChartData: boolean = false;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.drawExposureBarChart();
  }

  drawExposureBarChart = () => {
    let egressContainers: Array<ExposedContainer> = this.egress.flatMap(
      service => {
        return service.children;
      }
    );
    let ingressContainers: Array<ExposedContainer> = this.ingress.flatMap(
      service => {
        return service.children;
      }
    );
    this.chartNumbers = {
      ingress: new Map([
        [GlobalConstant.POLICY_ACTION.ALLOW, 0],
        [GlobalConstant.POLICY_ACTION.DENY, 0],
        [GlobalConstant.POLICY_ACTION.VIOLATE, 0],
        [GlobalConstant.POLICY_ACTION.THREAT, 0],
      ]),
      egress: new Map([
        [GlobalConstant.POLICY_ACTION.ALLOW, 0],
        [GlobalConstant.POLICY_ACTION.DENY, 0],
        [GlobalConstant.POLICY_ACTION.VIOLATE, 0],
        [GlobalConstant.POLICY_ACTION.THREAT, 0],
      ]),
    };
    this.accumulateData(ingressContainers, 'ingress');
    this.accumulateData(egressContainers, 'egress');
    this.exposureChartConfig = {
      options: {
        animation: !this.isReport,
        indexAxis: 'x',
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            ticks: {
              callback: value => {
                if (parseFloat(value as string) % 1 === 0) return value;
                return null;
              },
            },
          },
        },
        elements: {
          bar: {
            borderWidth: 4,
          },
        },
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 15,
              boxHeight: 15,
            },
          },
          title: {
            display: true,
            text: this.translate.instant(
              'dashboard.body.panel_title.EXPOSURES'
            ),
          },
        },
      },
      data: {
        labels: [
          this.translate.instant('dashboard.body.panel_title.ALLOW'),
          this.translate.instant('dashboard.body.panel_title.DENY'),
          this.translate.instant('dashboard.body.panel_title.ALERT'),
          this.translate.instant('dashboard.body.panel_title.THREAT'),
        ],
        datasets: [
          {
            data: Array.from(this.chartNumbers.ingress.values()),
            label: this.translate.instant(
              'dashboard.body.panel_title.INGRESS_CONTAINERS'
            ),
            backgroundColor: 'rgba(255, 13, 129, 0.2)',
            borderColor: '#ff0d81',
            hoverBackgroundColor: 'rgba(255, 13, 129, 0.2)',
            hoverBorderColor: '#ff0d81',
            borderWidth: 2,
          },
          {
            data: Array.from(this.chartNumbers.egress.values()),
            label: this.translate.instant(
              'dashboard.body.panel_title.EGRESS_CONTAINERS'
            ),
            backgroundColor: 'rgba(255, 113, 1, 0.2)',
            borderColor: '#ff7101',
            hoverBackgroundColor: 'rgba(255, 113, 1, 0.2)',
            hoverBorderColor: '#ff7101',
            borderWidth: 2,
          },
        ],
      },
      type: 'bar',
    };
    this.noChartData =
      this.exposureChartConfig.data.datasets[0].data.reduce(
        (prev, curr) => prev + curr
      ) === 0 &&
      this.exposureChartConfig.data.datasets[1].data.reduce(
        (prev, curr) => prev + curr
      ) === 0;
  };

  private accumulateData = (exposedContainers, direction) => {
    exposedContainers.forEach(exposedContainer => {
      if (exposedContainer.severity) {
        this.chartNumbers[direction].set(
          'threat',
          this.chartNumbers[direction].get('threat') + 1
        );
      } else {
        let policyAction = exposedContainer.policy_action.toLowerCase();
        this.chartNumbers[direction].set(
          policyAction,
          this.chartNumbers[direction].get(policyAction) + 1
        );
      }
    });
  };
}
