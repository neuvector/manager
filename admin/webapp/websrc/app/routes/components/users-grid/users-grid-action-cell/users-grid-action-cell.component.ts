import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-users-grid-action-cell',
  templateUrl: './users-grid-action-cell.component.html',
  styleUrls: ['./users-grid-action-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersGridActionCellComponent implements ICellRendererAngularComp {
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

  unlock(): void {
    this.params.unlock(this.params);
  }

  reset(): void {
    this.params.reset(this.params);
  }
}
