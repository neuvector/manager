import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-apikeys-grid-state-cell',
  templateUrl: './apikeys-grid-state-cell.component.html',
  styleUrls: ['./apikeys-grid-state-cell.component.scss'],
})
export class ApikeysGridStateCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
