import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-regulations-cell',
  templateUrl: './regulations-cell.component.html',
  styleUrls: ['./regulations-cell.component.scss'],
  
})
export class RegulationsCellComponent implements ICellRendererAngularComp {
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
