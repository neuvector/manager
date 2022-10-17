import { Component, Input, OnInit } from '@angular/core';
import { Audit } from '@common/types';

@Component({
  selector: 'app-risk-reports-printable-report-location-col',
  templateUrl: './risk-reports-printable-report-location-col.component.html',
  styleUrls: ['./risk-reports-printable-report-location-col.component.scss'],
})
export class RiskReportsPrintableReportLocationColComponent implements OnInit {
  @Input() audit!: Audit;
  get formattedPlatform() {
    return this.audit.platform_version
      ? `${this.audit.platform}: ${this.audit.platform_version}`
      : this.audit.platform;
  }

  constructor() {}

  ngOnInit(): void {}
}
