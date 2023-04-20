import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-apikeys-grid-action-cell',
  templateUrl: './apikeys-grid-action-cell.component.html',
  styleUrls: ['./apikeys-grid-action-cell.component.scss'],
})
export class ApikeysGridActionCellComponent
  implements ICellRendererAngularComp
{
  params: any;
  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  delete(): void {
    this.params.delete(this.params);
  }
}
