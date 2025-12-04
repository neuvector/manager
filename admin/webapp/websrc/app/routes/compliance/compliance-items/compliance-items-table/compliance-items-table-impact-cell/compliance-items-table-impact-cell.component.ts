import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';


@Component({
  standalone: false,
  selector: 'app-compliance-items-table-impact-cell',
  templateUrl: './compliance-items-table-impact-cell.component.html',
  styleUrls: ['./compliance-items-table-impact-cell.component.scss'],
  
})
export class ComplianceItemsTableImpactCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
