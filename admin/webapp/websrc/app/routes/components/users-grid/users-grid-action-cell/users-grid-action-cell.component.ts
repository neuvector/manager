import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-users-grid-action-cell',
  templateUrl: './users-grid-action-cell.component.html',
  styleUrls: ['./users-grid-action-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersGridActionCellComponent implements ICellRendererAngularComp {
  params: any;
  get isRemote() {
    return GlobalVariable.isRemote;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  allowReset(params: any): boolean {
    switch (params.role) {
      case MapConstant.FED_ROLES.ADMIN:
        return ![
          MapConstant.FED_ROLES.FEDADMIN,
          MapConstant.FED_ROLES.FEDREADER,
        ].includes(params.data.role);
      case MapConstant.FED_ROLES.FEDADMIN:
        return true;
      default:
        return ![
          MapConstant.FED_ROLES.ADMIN,
          MapConstant.FED_ROLES.FEDADMIN,
          MapConstant.FED_ROLES.FEDREADER,
        ].includes(params.data.role);
    }
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

  view(): void {
    this.params.view(this.params);
  }
}
