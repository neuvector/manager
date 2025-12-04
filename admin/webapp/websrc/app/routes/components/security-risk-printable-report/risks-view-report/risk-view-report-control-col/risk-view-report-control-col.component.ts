import { Component, Input, OnInit } from '@angular/core';


@Component({
  standalone: false,
  selector: 'app-risk-view-report-control-col',
  templateUrl: './risk-view-report-control-col.component.html',
  styleUrls: ['./risk-view-report-control-col.component.scss'],
  
})
export class RiskViewReportControlColComponent implements OnInit {
  displayedControl!: string[];
  @Input() control_id!: string;

  constructor() {}

  ngOnInit(): void {
    this.displayedControl = this.control_id ? this.control_id.split(',') : [];
  }
}
