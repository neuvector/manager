import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-risks-view-report',
  templateUrl: './risks-view-report.component.html',
  styleUrls: ['./risks-view-report.component.scss']
})
export class RisksViewReportComponent implements OnInit {

  @Input() reportPage: string;
  @Input() data: any;
  @Input() charts: any;

  constructor() { }

  ngOnInit(): void {
  }

}
