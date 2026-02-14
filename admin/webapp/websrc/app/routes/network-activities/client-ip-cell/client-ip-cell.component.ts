import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-client-ip-cell',
  templateUrl: './client-ip-cell.component.html',
  styleUrls: ['./client-ip-cell.component.scss'],
})
export class ClientIpCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
