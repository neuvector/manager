import { Component, Input } from '@angular/core';
import { Audit } from '@common/types';


@Component({
  standalone: false,
  selector: 'app-risk-reports-printable-report-detail-col',
  templateUrl: './risk-reports-printable-report-detail-col.component.html',
  styleUrls: ['./risk-reports-printable-report-detail-col.component.scss'],
  
})
export class RiskReportsPrintableReportDetailColComponent {
  @Input() audit!: Audit;

  constructor() {}
}
