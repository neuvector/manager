import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-risk-view-report-impact-col',
  templateUrl: './risk-view-report-impact-col.component.html',
  styleUrls: ['./risk-view-report-impact-col.component.scss']
})
export class RiskViewReportImpactColComponent implements OnInit {

  @Input() nodes: any[];
  @Input() containers: any[];
  @Input() images: any[];
  Array = Array;

  constructor() { }

  ngOnInit(): void {
  }

}
