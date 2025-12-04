import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Compliance } from '@common/types';
import { ChartConfiguration } from 'chart.js';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-compliance-charts',
  templateUrl: './compliance-charts.component.html',
  styleUrls: ['./compliance-charts.component.scss'],
})
export class ComplianceChartsComponent implements OnChanges {
  @Input() compliances!: Compliance[];
  top5Compliance: {
    platform: number;
    node: number;
    container: number;
    image: number;
    total: number;
    name: string;
  }[] = [];
  top5Container: {
    container: number;
    name: string;
  }[] = [];
  complianceChartData!: ChartConfiguration<'bar', number[], string[]>;
  containerChartData!: ChartConfiguration<'bar', number[], string[]>;
  barChartColors = {
    topContainers: '#f22d3a',
    container: '#4D5360',
    node: '#36A2EB',
    platform: '#f22d3a',
    image: '#86aec2',
  };

  constructor(private translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.compliances) {
      this.findTopFive(changes.compliances.currentValue);
      this.setComplianceChartData();
      this.setContainerChartData();
    }
  }

  private findTopFive(compliances: Compliance[]) {
    compliances.forEach(compliance => {
      const image = compliance.images.length;
      const node = compliance.nodes.length;
      const container = compliance.workloads.length;
      const platform = compliance.platforms.length;
      const name = compliance.name;
      const total = image + node + container + platform;
      if (this.top5Compliance.length < 5) {
        this.top5Compliance.push({
          platform,
          node,
          container,
          image,
          total,
          name,
        });
      } else if (total > this.top5Compliance[4].total) {
        this.top5Compliance[4] = {
          platform,
          node,
          container,
          image,
          total,
          name,
        };
      }
      if (this.top5Container.length < 5) {
        this.top5Container.push({
          container,
          name,
        });
      } else if (container > this.top5Container[4].container) {
        this.top5Container[4] = {
          container,
          name,
        };
      }
      this.top5Compliance.sort(({ total: a }, { total: b }) => {
        if (a === b) return 0;
        return a > b ? -1 : 1;
      });
      this.top5Container.sort(({ container: a }, { container: b }) => {
        if (a === b) return 0;
        return a > b ? -1 : 1;
      });
    });
  }

  private setComplianceChartData() {
    this.complianceChartData = {
      options: {
        scales: {
          y: {
            beginAtZero: true,
            stacked: true,
          },
          x: {
            stacked: true,
            beginAtZero: true,
          },
        },
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'point',
          },
          title: {
            display: true,
            text: this.translate.instant(
              'cis.report.others.TOP_IMPACTFUL_COMP'
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
        labels: this.top5Compliance.map(c => [c.name]),
        datasets: [
          {
            data: this.top5Compliance.map(c => c.container),
            label: 'Container',
            backgroundColor: this.barChartColors.container,
            hoverBackgroundColor: this.barChartColors.container,
            barThickness: 12,
            borderWidth: 0,
            barPercentage: 0.04,
          },
          {
            data: this.top5Compliance.map(c => c.node),
            label: 'Node',
            backgroundColor: this.barChartColors.node,
            hoverBackgroundColor: this.barChartColors.node,
            barThickness: 12,
            borderWidth: 0,
            barPercentage: 0.04,
          },
          {
            data: this.top5Compliance.map(c => c.image),
            label: 'Image',
            backgroundColor: this.barChartColors.image,
            hoverBackgroundColor: this.barChartColors.image,
            barThickness: 12,
            borderWidth: 0,
            barPercentage: 0.04,
          },
          {
            data: this.top5Compliance.map(c => c.platform),
            label: 'Platform',
            backgroundColor: this.barChartColors.platform,
            hoverBackgroundColor: this.barChartColors.platform,
            barThickness: 12,
            borderWidth: 0,
            barPercentage: 0.04,
          },
        ],
      },
      type: 'bar',
    };
  }

  private setContainerChartData() {
    this.containerChartData = {
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
          x: {
            beginAtZero: true,
          },
        },
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'point',
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
        labels: this.top5Container.map(c => [c.name]),
        datasets: [
          {
            data: this.top5Container.map(c => c.container),
            label: this.translate.instant(
              'cis.report.others.TOP_COMP_CONTAINER'
            ),
            backgroundColor: this.barChartColors.topContainers,
            hoverBackgroundColor: this.barChartColors.topContainers,
            barThickness: 12,
            borderWidth: 0,
            barPercentage: 0.04,
          },
        ],
      },
      type: 'bar',
    };
  }
}
