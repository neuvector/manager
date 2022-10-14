import { Component, Input, OnInit } from '@angular/core';
import { Audit } from '@common/types';

@Component({
  selector: 'app-risk-reports-printable-report',
  templateUrl: './risk-reports-printable-report.component.html',
  styleUrls: ['./risk-reports-printable-report.component.scss'],
})
export class RiskReportsPrintableReportComponent implements OnInit {
  @Input() riskReports!: Audit[];
  severityDistribution!: Map<string, number>;
  scanDistribution!: Map<string, number>;

  constructor() {}

  ngOnInit(): void {}
}
