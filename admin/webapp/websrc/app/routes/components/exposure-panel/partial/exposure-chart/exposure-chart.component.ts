import { Component, OnInit, Input } from '@angular/core';
import { HierarchicalExposure, ExposedContainer } from '@common/types';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-exposure-chart',
  templateUrl: './exposure-chart.component.html',
  styleUrls: ['./exposure-chart.component.scss']
})
export class ExposureChartComponent implements OnInit {

  @Input() ingress: Array<HierarchicalExposure>;
  @Input() egress: Array<HierarchicalExposure>;
  exposureChartConfig: any;
  chartNumbers: any;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.drawExposureBarChart();
  }

  drawExposureBarChart = () => {
    let egressContainers: Array<ExposedContainer> = this.egress.flatMap(service => {
      return service.children;
    });
    let ingressContainers: Array<ExposedContainer> = this.ingress.flatMap(service => {
      return service.children;
    });
    this.chartNumbers = {
      ingress: new Map([
        ['allow', 0],
        ['deny', 0],
        ['violate', 0],
        ['threat', 0]
      ]),
      egress: new Map([
        ['allow', 0],
        ['deny', 0],
        ['violate', 0],
        ['threat', 0]
      ])
    };
    this.accumulateData(ingressContainers, 'ingress');
    this.accumulateData(egressContainers, 'egress');
    console.log('Object.values(this.chartNumbers.ingress)', Array.from(this.chartNumbers.ingress.values()))
    console.log('Object.values(this.chartNumbers.egress)', Array.from(this.chartNumbers.egress.values()))
    this.exposureChartConfig = {
      options: {
        indexAxis: 'x',
        scales: {
          x: {
            stacked: true,
          },
          y: {
            ticks: {
              callback: (value) => {
                if (parseFloat(value as string) % 1 === 0) return value;
                return null;
              }
            }
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
              boxHeight: 15
            }
          },
          title: {
            display: true,
            text: 'Exposures',
          },
        },
      },
      data: {
        labels: [
          this.translate.instant('dashboard.body.panel_title.ALLOW'),
          this.translate.instant('dashboard.body.panel_title.DENY'),
          this.translate.instant('dashboard.body.panel_title.ALERT'),
          this.translate.instant('dashboard.body.panel_title.THREAT')
        ],
        datasets: [
          {
            data: Array.from(this.chartNumbers.ingress.values()),
            label: 'Ingress Pods',
            backgroundColor: 'rgba(255, 13, 129, 0.2)',
            borderColor: '#ff0d81',
            hoverBackgroundColor: 'rgba(255, 13, 129, 0.2)',
            hoverBorderColor: '#ff0d81',
            borderWidth: 2,
          },
          {
            data: Array.from(this.chartNumbers.egress.values()),
            label: 'Egress Pods',
            backgroundColor: 'rgba(255, 113, 1, 0.2)',
            borderColor: '#ff7101',
            hoverBackgroundColor: 'rgba(255, 113, 1, 0.2)',
            hoverBorderColor: '#ff7101',
            borderWidth: 2,
          },
        ]
      },
      type: 'bar'
    };
  };

  private accumulateData = (exposedContainers, direction) => {
    exposedContainers.forEach(exposedContainer => {
      if (exposedContainer.severity) {
        this.chartNumbers[direction].set('threat', this.chartNumbers[direction].get('threat') + 1);
      } else {
        let policyAction = exposedContainer.policy_action.toLowerCase();
        this.chartNumbers[direction].set(policyAction, this.chartNumbers[direction].get(policyAction) + 1);
      }
    });
  };

}
