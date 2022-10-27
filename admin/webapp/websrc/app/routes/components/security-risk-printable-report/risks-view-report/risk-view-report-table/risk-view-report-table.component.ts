import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  selector: 'app-risk-view-report-table',
  templateUrl: './risk-view-report-table.component.html',
  styleUrls: ['./risk-view-report-table.component.scss']
})
export class RiskViewReportTableComponent implements OnInit {

  @Input() data: any;
  @Input() reportPage: string;
  colourMap: any = MapConstant.colourMap;

  constructor() { }

  ngOnInit(): void {
  }

}
