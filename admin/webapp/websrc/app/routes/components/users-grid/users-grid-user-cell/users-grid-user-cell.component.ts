import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-users-grid-user-cell',
  templateUrl: './users-grid-user-cell.component.html',
  styleUrls: ['./users-grid-user-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersGridUserCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  username!: string;
  emailHash!: string;
  get gravatarEnabled() {
    return GlobalVariable.gravatar;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.username = this.params.data.username;
    this.emailHash = this.params.data.emailHash;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
