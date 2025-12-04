import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Module } from '@common/types';
import { ChartConfiguration } from 'chart.js';


enum CVE_ST {
  FIXABLE = 'fix exists',
  UNPATCHED = 'unpatched',
  WILL_NOT_FIX = 'will not fix',
  UNAFFECTED = 'unaffected',
}

const Colors = [
  '#ef5350',
  '#f77472',
  '#fc8886',
  '#ffc6c4',
  '#ffdddb',
  '#c7c7c7',
];

@Component({
  standalone: false,
  selector: 'app-modules-charts',
  templateUrl: './modules-charts.component.html',
  styleUrls: ['./modules-charts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class ModulesChartsComponent implements OnInit {
  @Input() modules!: Module[];
  noVunerablities = false;
  pieChartData!: ChartConfiguration<'pie', number[], string[]>;
  barChartData!: ChartConfiguration<'bar', number[], string[]>;

  ngOnInit(): void {
    const newRegistryDetails = this.modules
      .slice()
      .sort(this.sortByVulnerabilities);
    const topFive = newRegistryDetails
      .slice(0, 5)
      .map(module => {
        return {
          repository: module.name,
          vulnerabilities: module.cves?.length || 0,
        };
      })
      .filter(v => v.vulnerabilities > 0);
    const otherVulnerabilities = newRegistryDetails
      .slice(5, newRegistryDetails.length)
      .reduce((sum, module) => sum + (module.cves?.length || 0), 0);
    const topSix = [
      ...topFive.map(i => {
        return { repository: i.repository, vulnerabilities: i.vulnerabilities };
      }),
      { repository: 'others', vulnerabilities: otherVulnerabilities },
    ];
    const topFiveFixable = newRegistryDetails.slice(0, 5).map(module => {
      return module.cves?.filter(v => v.status === CVE_ST.FIXABLE).length || 0;
    });
    const topFiveUnpatched = newRegistryDetails.slice(0, 5).map(module => {
      return (
        module.cves?.filter(v => v.status === CVE_ST.UNPATCHED).length || 0
      );
    });
    const topFiveWillNotFix = newRegistryDetails.slice(0, 5).map(module => {
      return (
        module.cves?.filter(v => v.status === CVE_ST.WILL_NOT_FIX).length || 0
      );
    });
    const colors = this.getColors(topFive.length);
    this.noVunerablities = topFive.every(v => !v.vulnerabilities);
    this.pieChartData = {
      options: {
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false,
            text: 'Top Riskiest Modules',
          },
          legend: {
            display: true,
            position: 'right',
          },
        },
      },
      data: {
        labels: topSix.map(item => {
          return [item.repository];
        }),
        datasets: [
          {
            hoverBorderColor: colors,
            hoverBackgroundColor: colors,
            backgroundColor: colors,
            data: topSix.map(item => item.vulnerabilities),
          },
        ],
      },
      type: 'pie',
    };

    this.barChartData = {
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            ticks: {
              callback: (value: any) => {
                if (value % 1 === 0) {
                  return value;
                }
              },
            },
            beginAtZero: true,
          },
        },
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false,
            text: 'Top Riskiest Images',
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
      data: {
        labels: topFive.map(item => {
          return [item.repository];
        }),
        datasets: [
          {
            data: topFiveFixable,
            backgroundColor: '#d32f2f',
            borderColor: '#d32f2f',
            hoverBackgroundColor: '#d32f2f',
            barThickness: 8,
            borderWidth: 1,
            label: 'Fixable',
            stack: 'a',
          },
          {
            data: topFiveUnpatched,
            backgroundColor: '#ff7101',
            borderColor: '#ff7101',
            hoverBackgroundColor: '#ff7101',
            barThickness: 8,
            borderWidth: 1,
            label: 'Unpatched',
            stack: 'a',
          },
          {
            data: topFiveWillNotFix,
            backgroundColor: '#4caf50',
            borderColor: '#4caf50',
            hoverBackgroundColor: '#4caf50',
            barThickness: 8,
            borderWidth: 1,
            label: 'Will Not Fix',
            stack: 'a',
          },
        ],
      },
      type: 'bar',
    };
  }

  getColors(len: number): string[] {
    if (len === 5) {
      return Colors;
    } else {
      const t = Colors.slice(0, len);
      t.push(Colors[5]);
      return t;
    }
  }

  sortByVulnerabilities(a: Module, b: Module): number {
    if ((a.cves?.length || 0) === (b.cves?.length || 0)) {
      return 0;
    }
    return (a.cves?.length || 0) > (b.cves?.length || 0) ? -1 : 1;
  }
}
