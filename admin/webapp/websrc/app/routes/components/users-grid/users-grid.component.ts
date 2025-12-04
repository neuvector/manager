import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MapConstant } from '@common/constants/map.constant';
import { ErrorResponse, EventItem, User } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { EventsService } from '@services/events.service';
import { NotificationService } from '@services/notification.service';
import { SettingsService } from '@services/settings.service';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import * as $ from 'jquery';
import { from, Subject } from 'rxjs';
import { concatMap, finalize, map, switchMap, take } from 'rxjs/operators';
import { AddEditUserDialogComponent } from './add-edit-user-dialog/add-edit-user-dialog.component';
import { UsersGridActionCellComponent } from './users-grid-action-cell/users-grid-action-cell.component';
import { UsersGridUsernameCellComponent } from './users-grid-username-cell/users-grid-username-cell.component';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { UsersGridUserCellComponent } from './users-grid-user-cell/users-grid-user-cell.component';
import { updateGridData } from '@common/utils/common.utils';

import  { DisplayControlDirective } from '@common/directives/displayControl.directive';

@Component({
  standalone: false,
  selector: 'app-users-grid',
  templateUrl: './users-grid.component.html',
  styleUrls: ['./users-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class UsersGridComponent implements OnInit {
  private readonly $win;
  domains: string[] = [];
  _rowData!: User[];
  @Input() set userData(value: { users: User[]; domains: string[] }) {
    this._rowData = value.users;
    if (value.domains.length) {
      this.domains = value.domains;
    }
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.rowData);
      this.gridApi.sizeColumnsToFit();
    }
    this.refreshing$.next(false);
  }
  @Input() globalRoles!: string[];
  @Input() domainRoles!: string[];
  get rowData() {
    return this._rowData;
  }
  @Output() refreshData = new EventEmitter<void>();
  refreshing$ = new Subject();
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  events!: EventItem[];
  removable: boolean = false;
  filtered: boolean = false;
  isWriteUserAuthorized!: boolean;
  filteredCount!: number;
  get userCount() {
    return this.rowData.length;
  }
  columnDefs: ColDef[] = [
    {
      headerName: this.tr.instant('user.gridHeader.USER'),
      headerCheckboxSelection: true,
      resizable: true,
      checkboxSelection: true,
      cellRenderer: 'userCellRenderer',
      sortable: false,
      cellClass: ['d-flex', 'align-items-center'],
      width: 85,
      minWidth: 78,
      maxWidth: 120,
    },
    {
      headerName: this.tr.instant('user.gridHeader.USER_NAME'),
      field: 'username',
      editable: false,
      cellRenderer: 'usernameCellRenderer',
      width: 130,
    },
    {
      headerName: this.tr.instant('user.gridHeader.ROLE'),
      field: 'role',
      valueFormatter: params => {
        if (params && params.value) {
          return params.value;
        } else {
          return params.data.server
            .toLowerCase()
            .includes(MapConstant.SERVER_TYPE.RANCHER)
            ? 'Rancher User'
            : 'Namespace User';
        }
      },
      width: 100,
    },
    {
      headerName: this.tr.instant('user.gridHeader.IDENTITY_PROVIDER'),
      field: 'server',
      cellRenderer: params => {
        const server = params.data.server;
        let result = '';
        if (server) {
          if (server.toLowerCase().includes(MapConstant.SERVER_TYPE.LDAP)) {
            result = MapConstant.AUTH_PROVIDER.LDAP;
          }
          if (server.toLowerCase().includes(MapConstant.SERVER_TYPE.OPENID)) {
            result = MapConstant.AUTH_PROVIDER.OPENID;
          }
          if (server.toLowerCase().includes(MapConstant.SERVER_TYPE.SAML)) {
            result = MapConstant.AUTH_PROVIDER.SAML;
          }
          if (
            server.toLowerCase().includes(MapConstant.SERVER_TYPE.OPENSHIFT)
          ) {
            result = MapConstant.AUTH_PROVIDER.OPENSHIFT;
          }
          if (server.toLowerCase().includes(MapConstant.SERVER_TYPE.RANCHER)) {
            result = server;
          }
        } else {
          result = this.tr.instant('partner.general.PROVIDER');
        }
        return result;
      },
      width: 100,
    },
    {
      headerName: this.tr.instant('user.gridHeader.EMAIL'),
      field: 'email',
    },
    {
      headerName: this.tr.instant('user.gridHeader.ACTION'),
      cellRenderer: 'actionCellRenderer',
      cellRendererParams: {
        isWriteUserAuthorized: undefined,
        isRemote: undefined,
        role: GlobalVariable.user.token.role,
        edit: event => this.editUser(event),
        delete: event => this.deleteUser(event),
        reset: event => this.resetUser(event),
        unlock: event => this.unlockUser(event),
        view: event => this.viewUser(event),
      },
      cellClass: ['d-flex', 'align-items-center'],
      sortable: false,
      width: 120,
    },
  ];

  constructor(
    private dialog: MatDialog,
    private utils: UtilsService,
    private settingsService: SettingsService,
    private eventsService: EventsService,
    private notificationService: NotificationService,
    private tr: TranslateService,
    private cd: ChangeDetectorRef,
    private authUtilsService: AuthUtilsService,
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.isWriteUserAuthorized =
      this.authUtilsService.getDisplayFlag('write_users');
    let actionCellParams =
      this.columnDefs[this.columnDefs.length - 1].cellRendererParams;
    actionCellParams.isWriteUserAuthorized = this.isWriteUserAuthorized;
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      rowHeight: 40,
      rowData: this.rowData,
      editType: 'fullRow',
      rowSelection: 'multiple',
      rowMultiSelectWithClick: true,
      suppressRowClickSelection: true,
      isRowSelectable: node =>
        node.data
          ? node.data.fullname !== 'admin' && this.isWriteUserAuthorized
          : false,
      onSelectionChanged: () => this.onSelectionChanged(),
      onCellClicked: e => this.getEventsByUser(e.node.data.fullname),
      onGridReady: event => this.onGridReady(event),
      components: {
        userCellRenderer: UsersGridUserCellComponent,
        usernameCellRenderer: UsersGridUsernameCellComponent,
        actionCellRenderer: UsersGridActionCellComponent,
      },
    };
    if (
      !this.domains.length &&
      'authorization_w' in GlobalVariable.namespaces4NamespaceUser
    ) {
      this.domains = GlobalVariable.namespaces4NamespaceUser['authorization_w'];
    }
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onSelectionChanged() {
    this.gridApi.sizeColumnsToFit();
    this.removable = this.gridApi.getSelectedNodes().length > 0;
    this.cd.markForCheck();
  }

  refresh() {
    this.refreshing$.next(true);
    this.refreshData.emit();
    this.removable = false;
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.userCount;
  }

  addUser() {
    const addDialogRef = this.dialog.open(AddEditUserDialogComponent, {
      width: '80%',
      maxWidth: '1100px',
      data: {
        isEdit: false,
        globalRoles: this.globalRoles,
        domainRoles: this.domainRoles,
        domains: this.domains,
      },
    });
    const addUser = user => {
      this.settingsService
        .addUser(user)
        .pipe(
          finalize(() => addDialogRef.componentInstance.saving$.next(false))
        )
        .subscribe({
          complete: () => {
            this.notificationService.open(this.tr.instant('user.ADD_USER_OK'));
            addDialogRef.componentInstance.onNoClick();
            // updateGridData(
            //   this.rowData,
            //   [user],
            //   this.gridOptions.api!,
            //   'username',
            //   'add'
            // );
            this.refresh();
          },
          error: ({ error }: { error: ErrorResponse }) => {
            this.notificationService.openError(
              error,
              this.tr.instant('user.ADD_USER_ERR')
            );
            addDialogRef.componentInstance.saving$.next(false);
          },
        });
    };
    addDialogRef.componentInstance.confirm.subscribe(userForm => {
      const user = {
        fullname: userForm.username,
        server: '',
        username: userForm.username,
        password: userForm.passwordForm.newPassword,
        email: userForm.email,
        role: userForm.role,
        locale: userForm.locale,
        default_password: false,
        modify_password: false,
        role_domains: userForm.role_domains,
      };
      addUser(user);
    });
  }

  editUser(event: ICellRendererParams) {
    const editDialogRef = this.dialog.open(AddEditUserDialogComponent, {
      width: '80%',
      maxWidth: '1100px',
      data: {
        isEdit: true,
        user: event.data,
        globalRoles: this.globalRoles,
        domainRoles: this.domainRoles,
        domains: this.domains,
      },
    });
    editDialogRef.componentInstance.confirm.subscribe(userForm => {
      this.settingsService.patchUser(userForm).subscribe({
        complete: () => {
          this.notificationService.open(
            this.tr.instant('user.editUser.SUBMIT_OK')
          );
          editDialogRef.componentInstance.onNoClick();
          // updateGridData(
          //   this.rowData,
          //   [userForm],
          //   this.gridOptions.api!,
          //   'username',
          //   'edit'
          // );
          this.refresh();
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.tr.instant('user.editUser.SUBMIT_NG')
          );
          editDialogRef.componentInstance.saving$.next(false);
        },
      });
    });
  }

  deleteUser(event?: ICellRendererParams) {
    const users =
      event === undefined
        ? this.gridApi.getSelectedNodes().map(n => n.data.fullname)
        : [event?.data.fullname];
    const deleteMessage =
      users.length > 1
        ? this.tr.instant('user.deleteUser.group_prompt', {
            count: users.length,
          })
        : this.tr.instant('user.deleteUser.prompt', {
            username: users[0],
          });
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
        switchMap(() => from(users)),
        concatMap(userId => this.settingsService.deleteUser(userId)),
        finalize(() => {
          updateGridData(
            this.rowData,
            users.map(user => {
              return { username: user };
            }),
            this.gridApi!,
            'username',
            'delete'
          );
          deleteDialogRef.componentInstance.onCancel();
          deleteDialogRef.componentInstance.loading = false;
        })
      )
      .subscribe({
        complete: () => {
          this.notificationService.open(this.tr.instant('user.REMOVE_USER_OK'));
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.tr.instant('user.REMOVE_USER_ERR')
          );
        },
      });
  }

  viewUser(event) {
    const editDialogRef = this.dialog.open(AddEditUserDialogComponent, {
      width: '80%',
      maxWidth: '1100px',
      data: {
        isReadOnly: true,
        isEdit: true,
        user: event.data,
        globalRoles: this.globalRoles,
        domainRoles: this.domainRoles,
        domains: this.domains,
      },
    });
  }

  unlockUser(event: ICellRendererParams) {
    const user = event.data.fullname;
    const unlockDialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '80%',
      maxWidth: '600px',
      data: {
        message: this.tr.instant(
          'passwordProfile.loginFailureAllowance.UNLOCK_WARNING'
        ),
      },
    });
    unlockDialogRef.componentInstance.confirm
      .pipe(
        take(1),
        switchMap(() => this.settingsService.unlockUser(user)),
        finalize(() => {
          let userInfo = this.rowData.filter(
            _user => _user.username === user
          )[0];
          updateGridData(
            this.rowData,
            [{ ...userInfo, username: user, blocked_for_failed_login: false }],
            this.gridApi!,
            'username',
            'edit'
          );
          unlockDialogRef.componentInstance.onCancel();
          unlockDialogRef.componentInstance.loading = false;
        })
      )
      .subscribe({
        complete: () => {
          this.notificationService.open(
            this.tr.instant('passwordProfile.msg.UNLOCK_USER_OK')
          );
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.tr.instant('passwordProfile.msg.UNLOCK_USER_NG')
          );
        },
      });
  }

  resetUser(event: ICellRendererParams) {
    const resetDialogRef = this.dialog.open(AddEditUserDialogComponent, {
      width: '80%',
      maxWidth: '1100px',
      data: {
        isReset: true,
        user: event.data,
      },
    });
    resetDialogRef.componentInstance.confirm.subscribe(userForm => {
      this.settingsService
        .resetUser({
          username: userForm.username,
          password: userForm.passwordForm.newPassword,
          login_reset: userForm.loginReset,
        })
        .subscribe({
          complete: () => {
            this.notificationService.open(
              this.tr.instant('user.resetPassword.RESET_OK')
            );
            resetDialogRef.componentInstance.onNoClick();
            let userInfo = this.rowData.filter(
              user => user.username === userForm.username
            )[0];
            updateGridData(
              this.rowData,
              [
                {
                  ...userInfo,
                  username: userForm.username,
                  blocked_for_password_expired: false,
                },
              ],
              this.gridApi!,
              'username',
              'edit'
            );
          },
          error: ({ error }: { error: ErrorResponse }) => {
            this.notificationService.openError(
              error,
              this.tr.instant('user.resetPassword.RESET_NG')
            );
            resetDialogRef.componentInstance.saving$.next(false);
          },
        });
    });
  }

  getEventsByUser(username) {
    this.eventsService
      .getEventsByLimit(0, 1000)
      .pipe(map(events => events.filter(e => e.user === username)))
      .subscribe({
        next: events => {
          this.events = events.slice(0, 4);
        },
        error: error => {
          this.notificationService.openError(
            error.error,
            this.tr.instant('user.USER_EVENT_ERR')
          );
        },
      });
  }
}
