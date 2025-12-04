import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-risk-view-report-impact-col',
  templateUrl: './risk-view-report-impact-col.component.html',
  styleUrls: ['./risk-view-report-impact-col.component.scss'],
})
export class RiskViewReportImpactColComponent {
  @Input() nodes: any[];
  @Input() containers: any[];
  @Input() images: any[];
  Array = Array;

  constructor() {}
}
