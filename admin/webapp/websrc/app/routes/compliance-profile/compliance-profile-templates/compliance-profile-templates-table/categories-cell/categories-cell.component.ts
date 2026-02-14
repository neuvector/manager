import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-categories-cell',
  templateUrl: './categories-cell.component.html',
  styleUrls: ['./categories-cell.component.scss'],
})
export class CategoriesCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  category!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.category = this.params.data.category;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
