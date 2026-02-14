import { Component, OnInit } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-monitor-metric-header',
  templateUrl: './monitor-metric-header.component.html',
  styleUrls: ['./monitor-metric-header.component.scss'],
})
export class MonitorMetricHeaderComponent implements IHeaderAngularComp {
  constructor() {}

  agInit(headerParams: IHeaderParams): void {}

  refresh(params: IHeaderParams): boolean {
    return false;
  }
}
