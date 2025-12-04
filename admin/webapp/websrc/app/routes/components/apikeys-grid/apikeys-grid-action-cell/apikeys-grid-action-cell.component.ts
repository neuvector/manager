import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
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

  view(): void {
    this.params.view(this.params);
  }

  delete(): void {
    this.params.delete(this.params);
  }
}
