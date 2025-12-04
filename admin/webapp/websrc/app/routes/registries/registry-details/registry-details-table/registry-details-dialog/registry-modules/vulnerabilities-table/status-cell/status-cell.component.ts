import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-status-cell',
  templateUrl: './status-cell.component.html',
  styleUrls: ['./status-cell.component.scss'],
})
export class StatusCellComponent implements ICellRendererAngularComp {
  value!: string;
  statuses = {
    'fix exists': 'registry.gridHeader.FIXABLE',
    unpatched: 'registry.gridHeader.UNPATCHED',
    'will not fix': 'registry.gridHeader.WILL_NOT_FIX',
  };

  agInit(params: any): void {
    this.value = this.setValue(params);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  setValue(params): string {
    return this.statuses[params.node.data.status];
  }
}
