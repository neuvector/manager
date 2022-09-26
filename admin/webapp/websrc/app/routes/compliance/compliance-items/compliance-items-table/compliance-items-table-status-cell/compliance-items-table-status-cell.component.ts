import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-compliance-items-table-status-cell',
  templateUrl: './compliance-items-table-status-cell.component.html',
  styleUrls: ['./compliance-items-table-status-cell.component.scss'],
})
export class ComplianceItemsTableStatusCellComponent
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
