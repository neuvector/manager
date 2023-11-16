import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-external-host-cell',
  templateUrl: './external-host-cell.component.html',
  styleUrls: ['./external-host-cell.component.scss']
})
export class ExternalHostCellComponent implements ICellRendererAngularComp {

  params!: ICellRendererParams;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

}
