import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-from-to-cell',
  templateUrl: './from-to-cell.component.html',
  styleUrls: ['./from-to-cell.component.scss'],
})
export class FromToCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
