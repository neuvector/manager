import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Permission } from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-roles-grid-permissions-cell',
  templateUrl: './roles-grid-permissions-cell.component.html',
  styleUrls: ['./roles-grid-permissions-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesGridPermissionsCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor(private tr: TranslateService) {}

  roleText(permission) {
    return `${this.tr.instant(
      `role.permissions.${permission.id.toUpperCase()}`
    )} (${permission.write ? 'M' : 'V'})`;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
