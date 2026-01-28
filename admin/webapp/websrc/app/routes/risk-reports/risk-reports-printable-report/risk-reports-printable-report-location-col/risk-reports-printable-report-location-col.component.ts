import { Component, Input } from '@angular/core';
import { Audit } from '@common/types';

@Component({
  standalone: false,
  selector: 'app-risk-reports-printable-report-location-col',
  templateUrl: './risk-reports-printable-report-location-col.component.html',
  styleUrls: ['./risk-reports-printable-report-location-col.component.scss'],
})
export class RiskReportsPrintableReportLocationColComponent {
  @Input() audit!: Audit;
  get formattedPlatform() {
    return this.audit.platform_version
      ? `${this.audit.platform}: ${this.audit.platform_version}`
      : this.audit.platform;
  }

  constructor() {}
}
