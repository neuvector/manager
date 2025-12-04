import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-templates-cell',
  templateUrl: './templates-cell.component.html',
  styleUrls: ['./templates-cell.component.scss'],
  
})
export class TemplatesCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  tags!: string[];

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.tags = this.params.data.tags;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
