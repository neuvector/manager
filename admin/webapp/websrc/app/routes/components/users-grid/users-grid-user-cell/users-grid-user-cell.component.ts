import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-users-grid-user-cell',
  templateUrl: './users-grid-user-cell.component.html',
  styleUrls: ['./users-grid-user-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersGridUserCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  username!: string;
  emailHash!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.username = this.params.data.username;
    this.emailHash = this.params.data.emailHash;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
