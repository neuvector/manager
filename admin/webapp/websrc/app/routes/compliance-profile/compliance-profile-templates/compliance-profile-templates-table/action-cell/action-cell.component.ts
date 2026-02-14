import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-action-cell',
  templateUrl: './action-cell.component.html',
  styleUrls: ['./action-cell.component.scss'],
})
export class ActionCellComponent implements ICellRendererAngularComp {
  params: any;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  edit(): void {
    this.params.edit(this.params);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
