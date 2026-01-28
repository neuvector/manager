import { Component, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-application-conversation-chart',
  templateUrl: './application-conversation-chart.component.html',
  styleUrls: ['./application-conversation-chart.component.scss'],
})
export class ApplicationConversationChartComponent implements OnInit {
  @Input() applications: any;
  @Input() isReport: boolean = false;
  applicationConversationBarChartConfig: any;
  noChartData: boolean = false;

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.drawApplicationConversationBarChart(this.applications);
  }

  drawApplicationConversationBarChart = (applications: any) => {
    applications.sort((a, b) => b[1].count - a[1].count);
    let applicationConversationLabel = applications.map(app => app[0]);
    let applicationConversationData = applications.map(app => app[1].count);
    this.noChartData = applicationConversationData.length === 0;
    this.applicationConversationBarChartConfig = {
      options: {
        animation: !this.isReport,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false,
            text: 'Application Conversations',
          },
          legend: {
            display: false,
          },
        },
      },
      data: {
        labels: applicationConversationLabel,
        datasets: [
          {
            data: applicationConversationData,
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
