import { Component, OnInit, Input, SecurityContext } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InternalSystemInfo } from '@common/types';

@Component({
  standalone: false,
  selector: 'app-policy-mode-chart',
  templateUrl: './policy-mode-chart.component.html',
  styleUrls: ['./policy-mode-chart.component.scss'],
})
export class PolicyModeChartComponent implements OnInit {
  @Input() assetsInfo: Array<any>;
  @Input() assetType: string;
  @Input() scoreInfo: InternalSystemInfo;
  @Input() is4Report: boolean = false;
  policyModePieChartConfig: any;
  noChartData: boolean = false;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.drawPolicyModePieChart(
      this.assetsInfo,
      this.assetType,
      this.scoreInfo
    );
  }

  drawPolicyModePieChart = (
    assetsInfo: Array<any>,
    assetType: string,
    scoreInfo: InternalSystemInfo
  ) => {
    const modes =
      assetType === 'services'
        ? ['protect', 'monitor', 'discover']
        : ['protect', 'monitor', 'discover', 'quarantined'];
    let assetsPolicyModeLabels: Array<string> = new Array(modes.length);
    let assetsPolicyModeData: Array<number> = new Array(modes.length);
    assetsPolicyModeLabels = modes.map(mode => {
      return this.translate.instant(`enum.${mode.toUpperCase()}`);
    });

    if (assetType === 'services') {
      assetsPolicyModeData = [
        scoreInfo.metrics.groups.protect_groups,
        scoreInfo.metrics.groups.monitor_groups,
        scoreInfo.metrics.groups.discover_groups,
      ];
    } else {
      let containerStateCount = {
        protect: 0,
        monitor: 0,
        discover: 0,
        quarantined: 0,
      };
      assetsInfo.forEach(container => {
        containerStateCount[container.state.toLowerCase()!]++;
      });
      assetsPolicyModeData = Object.values(containerStateCount);
    }

    this.noChartData =
      assetsPolicyModeData.reduce((prev, curr) => prev + curr) === 0;
    this.policyModePieChartConfig = {
      options: {
        animation: !this.is4Report,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false,
            text: `Policy Mode of ${
              this.assetType === 'services' ? 'Services' : 'Pods'
            }`,
          },
          legend: {
            display: true,
            position: 'right',
            labels: {
              boxWidth: 15,
              boxHeight: 15,
            },
          },
        },
      },
      data: {
        labels: assetsPolicyModeLabels,
        datasets: [
          {
            backgroundColor:
              this.assetType === 'services'
                ? [
                    'rgba(24, 109, 51, 0.3)',
                    'rgba(78, 57, 193, 0.3)',
                    'rgba(33, 150, 243, 0.3)',
                  ]
                : [
                    'rgba(24, 109, 51, 0.3)',
                    'rgba(78, 57, 193, 0.3)',
                    'rgba(33, 150, 243, 0.3)',
                    'rgba(233, 30, 99, 0.3)',
                  ],
            borderColor:
              this.assetType === 'services'
                ? ['#186d33', '#4E39C1', '#2196F3']
                : ['#186d33', '#4E39C1', '#2196F3', '#E91E63'],
            hoverBackgroundColor:
              this.assetType === 'services'
                ? [
                    'rgba(24, 109, 51, 0.3)',
                    'rgba(78, 57, 193, 0.3)',
                    'rgba(33, 150, 243, 0.3)',
                  ]
                : [
                    'rgba(24, 109, 51, 0.3)',
                    'rgba(78, 57, 193, 0.3)',
                    'rgba(33, 150, 243, 0.3)',
                    'rgba(233, 30, 99, 0.3)',
                  ],
            hoverBorderColor:
              this.assetType === 'services'
                ? ['#186d33', '#4E39C1', '#2196F3']
                : ['#186d33', '#4E39C1', '#2196F3', '#E91E63'],
            borderWidth: 2,
            data: assetsPolicyModeData,
          },
        ],
      },
      type: 'pie',
    };
  };
}
