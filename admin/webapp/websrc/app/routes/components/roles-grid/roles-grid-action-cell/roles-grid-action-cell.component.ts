import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-roles-grid-action-cell',
  templateUrl: './roles-grid-action-cell.component.html',
  styleUrls: ['./roles-grid-action-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesGridActionCellComponent implements ICellRendererAngularComp {
  params: any;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  edit(): void {
    this.params.edit(this.params);
  }

  delete(): void {
    this.params.delete(this.params);
  }
}
