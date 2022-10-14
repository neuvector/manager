import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-risk-reports-report-chart',
  templateUrl: './risk-reports-report-chart.component.html',
  styleUrls: ['./risk-reports-report-chart.component.scss'],
})
export class RiskReportsReportChartComponent implements OnInit {
  @Input() statisticData;
  @Input() isBarChart!: boolean;

  constructor() {}

  ngOnInit(): void {}
}
