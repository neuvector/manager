import { Component, OnInit } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-scorable-header',
  templateUrl: './scorable-header.component.html',
  styleUrls: ['./scorable-header.component.scss'],
})
export class ScorableHeaderComponent implements IHeaderAngularComp {
  constructor() {}

  agInit(headerParams: IHeaderParams): void {}

  refresh(params: IHeaderParams): boolean {
    return false;
  }
}
