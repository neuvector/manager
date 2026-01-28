import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ErrorResponse, PermissionOption, Role } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import { Subject } from 'rxjs';
import * as $ from 'jquery';
import { UtilsService } from '@common/utils/app.utils';
import { RolesGridPermissionsCellComponent } from './roles-grid-permissions-cell/roles-grid-permissions-cell.component';
import { RolesGridActionCellComponent } from './roles-grid-action-cell/roles-grid-action-cell.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { finalize, map, switchMap, take } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { NotificationService } from '@services/notification.service';
import { AddEditRoleDialogComponent } from './add-edit-role-dialog/add-edit-role-dialog.component';
import { AuthUtilsService } from '@common/utils/auth.utils';

@Component({
  standalone: false,
  selector: 'app-roles-grid',
  templateUrl: './roles-grid.component.html',
  styleUrls: ['./roles-grid.component.scss'],
})
export class RolesGridComponent implements OnInit {
  private readonly $win;
  globalOptions!: PermissionOption[];
  _rowData!: Role[];
  @Input() set rowData(value: Role[]) {
    this._rowData = value;
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.rowData);
      this.gridApi.sizeColumnsToFit();
    }
    this.refreshing$.next(false);
  }
  get rowData() {
    return this._rowData;
  }
  @Output() refreshData = new EventEmitter<void>();
  refreshing$ = new Subject();
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filtered: boolean = false;
  filteredCount!: number;
  get roleCount() {
    return this.rowData.length;
  }
  columnDefs: ColDef[] = [
    {
      headerName: this.tr.instant('role.gridHeader.ROLE_NAME'),
      field: 'name',
      cellRenderer: params => {
        if (params) {
          return params.value === '' ? 'none' : params.value;
        }
      },
      width: 80,
      minWidth: 80,
    },
    {
      headerName: this.tr.instant('role.gridHeader.COMMENT'),
      field: 'comment',
      width: 120,
      minWidth: 120,
    },
    {
      headerName: this.tr.instant('role.gridHeader.PERMISSIONS'),
      field: 'permissions',
      cellRenderer: 'permissionsCellRenderer',
      autoHeight: true,
      width: 350,
      minWidth: 350,
    },
    {
      sortable: false,
      cellRenderer: 'actionCellRenderer',
      cellRendererParams: {
        edit: event => this.editRole(event),
        delete: event => this.deleteRole(event),
      },
      cellClass: ['d-flex', 'align-items-center'],
      width: 120,
      minWidth: 120,
      maxWidth: 120,
    },
  ];

  constructor(
    private dialog: MatDialog,
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private tr: TranslateService,
    private utils: UtilsService,
    private authUtilsService: AuthUtilsService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    let isWriteRoleAuthrized = this.authUtilsService.getDisplayFlag('roles');
    if (!isWriteRoleAuthrized) {
      this.columnDefs.pop();
    }
    this.settingsService
      .getPermissionOptions()
      .pipe(map(r => r.global_options))
      .subscribe(res => (this.globalOptions = res));
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      rowData: this.rowData,
      onGridReady: event => this.onGridReady(event),
      components: {
        permissionsCellRenderer: RolesGridPermissionsCellComponent,
        actionCellRenderer: RolesGridActionCellComponent,
      },
    };
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  refresh(timeout?: number) {
    this.refreshing$.next(true);
    if (timeout === undefined) {
      this.refreshData.emit();
    } else {
      setTimeout(() => this.refreshData.emit(), timeout);
    }
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.roleCount;
  }

  addRole() {
    const addDialogRef = this.dialog.open(AddEditRoleDialogComponent, {
      width: '80%',
      maxWidth: '1100px',

      data: {
        isEdit: false,
        permissionOptions: this.globalOptions,
      },
    });
    addDialogRef.componentInstance.confirm
      .pipe(
        take(1),
        switchMap((role: Role) =>
          this.settingsService.addRole(role).pipe(map(res => ({ res, role })))
        ),
        finalize(() => {
          addDialogRef.componentInstance.saving$.next(false);
          addDialogRef.componentInstance.onNoClick();
        })
      )
      .subscribe({
        next: ({ res, role }) => {
          this.notificationService.open(this.tr.instant('role.msg.INSERT_OK'));
          this.rowData = [...this.rowData, role];
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.tr.instant('role.msg.INSERT_NG')
          );
        },
      });
  }

  editRole(event: ICellRendererParams) {
    const roleName = event.data.name;
    const editDialogRef = this.dialog.open(AddEditRoleDialogComponent, {
      width: '80%',
      maxWidth: '1100px',

      data: {
        isEdit: true,
        permissionOptions: this.globalOptions,
        role: event.data,
      },
    });
    editDialogRef.componentInstance.confirm
      .pipe(
        take(1),
        switchMap((role: Role) =>
          this.settingsService.patchRole(role).pipe(map(res => ({ res, role })))
        ),
        finalize(() => {
          editDialogRef.componentInstance.saving$.next(false);
          editDialogRef.componentInstance.onNoClick();
        })
      )
      .subscribe({
        next: ({ res, role }) => {
          this.notificationService.open(this.tr.instant('role.msg.UPDATE_OK'));
          this.rowData = [
            ...this.rowData.filter(r => r.name !== roleName),
            role,
          ];
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.tr.instant('role.msg.UPDATE_NG')
          );
        },
      });
  }

  deleteRole(event: ICellRendererParams) {
    const role = event.data.name;
    const deleteMessage = this.tr.instant('role.msg.REMOVE_CFM');
    const deleteDialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '80%',
      maxWidth: '600px',

      data: {
        message: deleteMessage,
      },
    });
    deleteDialogRef.componentInstance.confirm
      .pipe(
        take(1),
        switchMap(() => this.settingsService.deleteRole(role)),
        finalize(() => {
          deleteDialogRef.componentInstance.onCancel();
          deleteDialogRef.componentInstance.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.notificationService.open(this.tr.instant('role.msg.REMOVE_OK'));
          this.rowData = this.rowData.filter(r => r.name !== role);
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.tr.instant('role.msg.REMOVE_NG')
          );
        },
      });
  }
}
