import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ResponseRulesService } from '@services/response-rules.service';
import { AddEditResponseRuleModalComponent } from '../add-edit-response-rule-modal/add-edit-response-rule-modal.component';
import { UtilsService } from '@common/utils/app.utils';
import { NotificationService } from '@services/notification.service';
import { ConfirmDialogResponseRuleComponent } from '@components/response-rules/partial/confirm-dialog-response-rule/confirm-dialog-response-rule.component';
import { switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { updateGridData } from '@common/utils/common.utils';


@Component({
  standalone: false,
  selector: 'app-action-buttons',
  templateUrl: './action-buttons.component.html',
  styleUrls: ['./action-buttons.component.scss'],
  
})
export class ActionButtonsComponent implements ICellRendererAngularComp {
  public params;
  private isModalOpen: boolean = false;
  isWriteResponseRuleAuthorized: boolean = false;
  isOperatableRuleType: boolean = false;

  constructor(
    private translate: TranslateService,
    private responseRulesService: ResponseRulesService,
    public dialog: MatDialog,
    private utils: UtilsService,
    private notificationService: NotificationService
  ) {}

  agInit(params: any): void {
    if (params.node && params.node.data) {
      this.params = params;
    }
    this.isWriteResponseRuleAuthorized =
      this.params.context.componentParent.isWriteResponseRuleAuthorized;
    this.isOperatableRuleType =
      this.params.data.cfg_type !== GlobalConstant.CFG_TYPE.GROUND &&
      !(
        this.params.context.componentParent.source ===
          GlobalConstant.NAV_SOURCE.SELF &&
        this.params.data.cfg_type === GlobalConstant.CFG_TYPE.FED
      );
  }

  refresh(params: any): boolean {
    this.params = params;
    return true;
  }

  editResponseRule = (event, id, isReadonly = false): void => {
    this.responseRulesService.index4Edit = this.responseRulesService.getIndex(
      this.responseRulesService.responseRules,
      id
    );
    this.responseRulesService.getAutoCompleteData().subscribe(
      response => {
        this.openAddResponseRuleModal(
          response,
          GlobalConstant.MODAL_OP.EDIT,
          isReadonly
        );
      },
      err => {
        this.openAddResponseRuleModal(
          [],
          GlobalConstant.MODAL_OP.EDIT,
          isReadonly
        );
      }
    );
  };

  addResponseRule = (event, id): void => {
    if (!this.isModalOpen) {
      this.responseRulesService.index4Add = this.responseRulesService.getIndex(
        this.responseRulesService.responseRules,
        id
      );
      this.responseRulesService.getAutoCompleteData().subscribe(
        response => {
          this.openAddResponseRuleModal(response, GlobalConstant.MODAL_OP.ADD);
        },
        err => {
          this.openAddResponseRuleModal([], GlobalConstant.MODAL_OP.ADD);
        }
      );
      this.isModalOpen = true;
    }
  };

  private openAddResponseRuleModal = (
    autoCompleteData: Object[] = [],
    type,
    isReadonly = false
  ): void => {
    let addDialogRef = this.dialog.open(AddEditResponseRuleModalComponent, {
      data: {
        autoCompleteData: autoCompleteData,
        type: type,
        source: this.params.context.componentParent.source,
        isReadonly: isReadonly,
        gridApi: this.params.context.componentParent.gridApi!,
      },
      width: '70vw',
    });
    addDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.params.context.componentParent.getResponseRules();
        this.isModalOpen = false;
      }, 1000);
    });
  };

  toggleRuleItem = (event, data): void => {
    data.disable = !data.disable;
    let responseRule = {
      id: data.id,
      disable: data.disable,
      cfg_type: data.cfg_type,
    };
    this.responseRulesService
      .insertUpdateResponseRuleData(responseRule, [], 'toggle', [])
      .subscribe(
        response => {
          updateGridData(
            this.responseRulesService.responseRules,
            [data],
            this.params.context.componentParent.gridApi!,
            'id',
            'edit'
          );
          if (data.disable) {
            this.notificationService.open(
              this.translate.instant('responsePolicy.dialog.content.DISABLE_OK')
            );
          } else {
            this.notificationService.open(
              this.translate.instant('responsePolicy.dialog.content.ENABLE_OK')
            );
          }
        },
        error => {
          if (data.disable) {
            this.notificationService.openError(
              error.error,
              this.translate.instant('responsePolicy.dialog.content.DISABLE_NG')
            );
          } else {
            this.notificationService.openError(
              error.error,
              this.translate.instant('responsePolicy.dialog.content.ENABLE_NG')
            );
          }
        }
      );
  };

  deleteRuleItem = (event, id): void => {
    this.responseRulesService.index4Delete = this.responseRulesService.getIndex(
      this.responseRulesService.responseRules,
      id
    );
    let isQuarantined =
      this.responseRulesService.responseRules[
        this.responseRulesService.index4Delete
      ].actions.includes('quarantine');

    console.log('isQuarantined', isQuarantined);
    let message = `${this.translate.instant(
      'responsePolicy.dialog.content.REMOVE_CONFIRM'
    )} ${id}`;
    const dialogRef = this.dialog.open(ConfirmDialogResponseRuleComponent, {
      maxWidth: '700px',
      data: {
        message: message,
        isQuarantined: isQuarantined,
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          if (dialogRef.componentInstance.isUnquarantined) {
            return this.responseRulesService.unquarantine(id);
          } else {
            return this.responseRulesService.removeResponseRuleData(id);
          }
        })
      )
      .subscribe(
        res => {
          // confirm actions
          if (dialogRef.componentInstance.isUnquarantined) {
            this.notificationService.open(
              this.translate.instant(
                'responsePolicy.dialog.content.UNQUARANTINE_OK'
              )
            );
          }
          this.notificationService.open(
            this.translate.instant('responsePolicy.dialog.content.REMOVE_OK')
          );
          updateGridData(
            this.responseRulesService.responseRules,
            [{ id: id }],
            this.params.context.componentParent.gridApi!,
            'id',
            'delete'
          );
          // close dialog
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
        },
        error => {
          if (dialogRef.componentInstance.isUnquarantined) {
            this.notificationService.openError(
              error.error,
              this.translate.instant(
                'responsePolicy.dialog.content.UNQUARANTINE_NG'
              )
            );
          }
          this.notificationService.openError(
            error.error,
            this.translate.instant('responsePolicy.dialog.content.REMOVE_NG')
          );
          dialogRef.componentInstance.loading = false;
        }
      );
  };
}
