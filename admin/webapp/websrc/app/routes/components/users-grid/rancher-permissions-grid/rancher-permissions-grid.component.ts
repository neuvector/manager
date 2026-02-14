import { Component, OnInit, Input } from '@angular/core';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { GlobalVariable } from '@common/variables/global.variable';
import * as $ from 'jquery';
import { UtilsService } from '@common/utils/app.utils';
import { RolesGridPermissionsCellComponent } from '@components/roles-grid/roles-grid-permissions-cell/roles-grid-permissions-cell.component';

@Component({
  standalone: false,
  selector: 'app-rancher-permissions-grid',
  templateUrl: './rancher-permissions-grid.component.html',
  styleUrls: ['./rancher-permissions-grid.component.scss'],
})
export class RancherPermissionsGridComponent implements OnInit {
  @Input() rancherPermissions;

  private readonly $win;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      headerName: this.tr.instant('ldap.gridHeader.DOMAINS'),
      field: 'namespaces',
      valueFormatter: params => {
        if (!params.value) return '';
        return params.value.length > 5
          ? `${params.value.slice(0, 5).join(', ')}...(Total: ${
              params.value.length
            })`
          : params.value.join(', ');
      },
      width: 150,
      minWidth: 100,
    },
    {
      headerName: this.tr.instant('role.gridHeader.PERMISSIONS'),
      field: 'permissions',
      cellRenderer: 'permissionsCellRenderer',
      autoHeight: true,
      width: 500,
    },
  ];

  constructor(
    private tr: TranslateService,
    private utils: UtilsService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      rowData: this.rancherPermissions,
      components: {
        permissionsCellRenderer: RolesGridPermissionsCellComponent,
      },
    };
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }
}
