import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import {
  AdmissionRule,
  AdmRuleSubCriterion,
} from '@common/types/admission/admission';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { AddEditAdmissionRuleModalComponent } from '@components/admission-rules/partial/add-edit-admission-rule-modal/add-edit-admission-rule-modal.component';
import { AdmissionRulesService } from '@common/services/admission-rules.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { updateGridData } from '@common/utils/common.utils';

@Component({
  standalone: false,
  selector: 'app-action-buttons',
  templateUrl: './action-buttons.component.html',
  styleUrls: ['./action-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButtonsComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  isOperatableRuleType: boolean;
  CFG_TYPE = GlobalConstant.CFG_TYPE;
  isWriteAdmissionRuleAuthorized: boolean;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    public admissionRulesService: AdmissionRulesService,
    private notificationService: NotificationService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isWriteAdmissionRuleAuthorized =
      this.params.context.componentParent.isWriteAdmissionRuleAuthorized;
    this.isOperatableRuleType =
      this.params.data.cfg_type !== GlobalConstant.CFG_TYPE.GROUND &&
      !(
        this.params.context.componentParent.source ===
          GlobalConstant.NAV_SOURCE.SELF &&
        this.params.data.cfg_type === GlobalConstant.CFG_TYPE.FED
      );
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  editAdmissionRule = (event, rule) => {
    const addEditDialogRef = this.dialog.open(
      AddEditAdmissionRuleModalComponent,
      {
        width: '80%',
        data: {
          opType: GlobalConstant.MODAL_OP.EDIT,
          admissionOptions:
            this.params.context.componentParent.admissionOptions,
          cfgType:
            this.params.context.componentParent.source ===
            GlobalConstant.NAV_SOURCE.FED_POLICY
              ? GlobalConstant.SCOPE.FED
              : GlobalConstant.SCOPE.LOCAL,
          rule4Edit: rule,
          admissionRules: this.params.context.componentParent.admissionRules,
          gridApi: this.params.context.componentParent.gridApi!,
        },
      }
    );
  };

  viewRuleItem = (event, rule) => {
    const addEditDialogRef = this.dialog.open(
      AddEditAdmissionRuleModalComponent,
      {
        width: '80%',
        data: {
          opType: GlobalConstant.MODAL_OP.VIEW,
          admissionOptions:
            this.params.context.componentParent.admissionOptions,
          cfgType:
            this.params.context.componentParent.source ===
            GlobalConstant.NAV_SOURCE.FED_POLICY
              ? GlobalConstant.SCOPE.FED
              : GlobalConstant.SCOPE.LOCAL,
          rule4Edit: rule,
          refresh: this.params.context.componentParent.refresh,
        },
      }
    );
  };

  toggleRuleItem = (event, rule, disable) => {
    let selectedRule = JSON.parse(JSON.stringify(rule));
    selectedRule.disable = disable;
    if (selectedRule.rule_type === 'exception') delete selectedRule.rule_mode;
    if (selectedRule.critical) {
      let criteriaValueStr = selectedRule.criteria
        .map((value: AdmRuleSubCriterion) => value.value)
        .join(',')
        .toLowerCase();
      let namespace = '';
      if (
        criteriaValueStr.includes('system') ||
        criteriaValueStr.includes('kube')
      ) {
        namespace = 'system';
      } else if (criteriaValueStr.includes('neuvector')) {
        namespace = 'NeuVector';
      }
      let message = selectedRule.disable
        ? this.translate.instant(
            'admissionControl.msg.DISABLE_CONFIRM_DEFAULT',
            {
              namespace: namespace,
            }
          )
        : this.translate.instant(
            'admissionControl.msg.ENABLE_CONFIRM_DEFAULT',
            {
              namespace: namespace,
            }
          );
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: message,
        },
      });
      // listen to confirm subject
      dialogRef.componentInstance.confirm
        .pipe(
          switchMap(() => {
            return this.admissionRulesService.toggleAdmissionRules(
              selectedRule
            );
          })
        )
        .subscribe(
          res => {
            console.log(res);
            this.alertOnSuccess(selectedRule.disable, rule.id);
            // confirm actions
            updateGridData(
              this.params.context.componentParent.admissionRules,
              [selectedRule],
              this.params.context.componentParent.gridApi!,
              'id',
              'edit'
            );
            // close dialog
            dialogRef.componentInstance.onCancel();
            dialogRef.componentInstance.loading = false;
          },
          error => {
            this.alertOnError(selectedRule.disable, error);
          }
        );
    } else {
      this.admissionRulesService.toggleAdmissionRules(selectedRule).subscribe(
        response => {
          this.alertOnSuccess(selectedRule.disable, rule.id);
          updateGridData(
            this.params.context.componentParent.admissionRules,
            [selectedRule],
            this.params.context.componentParent.gridApi!,
            'id',
            'edit'
          );
        },
        error => {
          this.alertOnError(selectedRule.disable, error);
        }
      );
    }
  };

  deleteRuleItem = (event, rule) => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: `${this.translate.instant('policy.dialog.REMOVE')}? - ID: ${
          rule.id
        }`,
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.admissionRulesService.removeAdmissionRule(
            rule.cfg_type,
            rule.id
          );
        })
      )
      .subscribe(
        res => {
          // confirm actions
          updateGridData(
            this.params.context.componentParent.admissionRules,
            [rule],
            this.params.context.componentParent.gridApi!,
            'id',
            'delete'
          );
          this.notificationService.open(
            this.translate.instant('admissionControl.msg.REMOVE_OK')
          );
          // close dialog
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
        },
        error => {
          this.notificationService.openError(
            error.error,
            this.translate.instant('admissionControl.msg.REMOVE_NG')
          );
          dialogRef.componentInstance.loading = false;
        }
      );
  };

  private alertOnSuccess = (isDisabled, ruleId) => {
    let msgTitle = isDisabled
      ? `${this.translate.instant(
          'admissionControl.msg.DISABLE_OK'
        )} - ID: ${ruleId}`
      : `${this.translate.instant(
          'admissionControl.msg.ENABLE_OK'
        )} - ID: ${ruleId}`;
    this.notificationService.open(msgTitle);
  };

  private alertOnError = (isDisabled, error) => {
    let msgTitle = isDisabled
      ? this.translate.instant('admissionControl.msg.DISABLE_NG')
      : this.translate.instant('admissionControl.msg.ENABLE_NG');
    this.notificationService.openError(error.error, msgTitle);
  };
}
