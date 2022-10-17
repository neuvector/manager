import { Component, Input, OnInit } from '@angular/core';
import { Audit } from '@common/types';

@Component({
  selector: 'app-risk-reports-printable-report-detail-col',
  templateUrl: './risk-reports-printable-report-detail-col.component.html',
  styleUrls: ['./risk-reports-printable-report-detail-col.component.scss'],
})
export class RiskReportsPrintableReportDetailColComponent implements OnInit {
  @Input() audit!: Audit;

  constructor() {}

  ngOnInit(): void {}
}
