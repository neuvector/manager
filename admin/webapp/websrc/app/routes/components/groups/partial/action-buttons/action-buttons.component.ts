import { Component, OnInit, SecurityContext } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { Group } from '@common/types';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { AddEditGroupModalComponent } from '../add-edit-group-modal/add-edit-group-modal.component';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { GroupsService } from '@services/groups.service';
import { NotificationService } from '@services/notification.service';

@Component({
  standalone: false,
  selector: 'app-action-buttons',
  templateUrl: './action-buttons.component.html',
  styleUrls: ['./action-buttons.component.scss'],
})
export class ActionButtonsComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  isReadonlyRule: boolean;
  isAddressGroupAndNamespaceUser: boolean;
  isRemovableGroup: boolean;

  constructor(
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private groupsService: GroupsService,
    private notificationService: NotificationService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isReadonlyRule =
      params.data.cfg_type === GlobalConstant.CFG_TYPE.GROUND ||
      (this.params.context.componentParent.source ===
      GlobalConstant.NAV_SOURCE.FED_POLICY
        ? false
        : params.data.cfg_type === GlobalConstant.CFG_TYPE.FED);
    this.isAddressGroupAndNamespaceUser =
      this.params.context.componentParent.isNamespaceUser &&
      params.data.kind.toLowerCase() === MapConstant.GROUP_KIND.ADDRESS;
    this.isRemovableGroup = this.verifyRemovable(params.data);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  editGroup = (group: Group) => {
    const addEditDialogRef = this.dialog.open(AddEditGroupModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.EDIT,
        source: this.params.context.componentParent.source,
        cfgType:
          this.params.context.componentParent.source ===
          GlobalConstant.NAV_SOURCE.FED_POLICY
            ? GlobalConstant.CFG_TYPE.FED
            : this.params.data.cfg_type,
        selectedGroup: this.params.data,
        refresh:
          this.params.context.componentParent.source ===
          GlobalConstant.NAV_SOURCE.FED_POLICY
            ? this.params.context.componentParent.getFedGroups
            : this.params.context.componentParent.getGroups,
      },
    });
  };

  viewGroup = (group: Group) => {
    const addEditDialogRef = this.dialog.open(AddEditGroupModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.VIEW,
        source: this.params.context.componentParent.source,
        cfgType:
          this.params.context.componentParent.source ===
          GlobalConstant.NAV_SOURCE.FED_POLICY
            ? GlobalConstant.SCOPE.FED
            : this.params.data.cfg_type,
        selectedGroup: this.params.data,
        refresh: this.params.context.componentParent.getGroups,
      },
    });
  };

  deleteGroup = (group: Group) => {
    let message = `${this.translate.instant(
      'group.REMOVE_CONFIRM'
    )} - ${this.sanitizer.sanitize(SecurityContext.HTML, group.name)}`;
    let supplemental = '';
    if (group.policy_rules.length > 0 || group.response_rules.length > 0) {
      supplemental = this.translate.instant('group.HAS_RULES_WARNING');
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: message,
        supplemental: supplemental,
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.groupsService.removeGroupData(group.name);
        })
      )
      .subscribe(
        res => {
          // confirm actions
          this.notificationService.open(
            this.translate.instant('group.REMOVE_OK_MSG')
          );
          setTimeout(() => {
            this.params.context.componentParent.source ===
            GlobalConstant.NAV_SOURCE.FED_POLICY
              ? this.params.context.componentParent.getFedGroups()
              : this.params.context.componentParent.getGroups();
          }, 2000);
          // close dialog
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
        },
        error => {
          this.notificationService.openError(
            error.error,
            this.translate.instant('group.REMOVE_ERR_MSG')
          );
          dialogRef.componentInstance.loading = false;
        }
      );
  };

  private verifyRemovable = group => {
    return (
      group.cfg_type !== GlobalConstant.CFG_TYPE.GROUND &&
      (this.params.context.componentParent.source ===
      GlobalConstant.NAV_SOURCE.FED_POLICY
        ? true
        : group.cfg_type !== GlobalConstant.CFG_TYPE.FED) &&
      (group.cfg_type !== GlobalConstant.CFG_TYPE.LEARNED ||
        (group.cfg_type === GlobalConstant.CFG_TYPE.LEARNED &&
          group.members.length === 0)) &&
      !group.reserved &&
      group.kind !== MapConstant.GROUP_KIND.IP_SERVICE
    );
  };
}
