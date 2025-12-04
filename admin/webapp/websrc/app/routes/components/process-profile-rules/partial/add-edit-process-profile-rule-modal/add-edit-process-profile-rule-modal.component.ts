import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UtilsService } from '@common/utils/app.utils';
import { ProcessProfileRulesService } from '@services/process-profile-rules.service';
import { GroupsService } from '@services/groups.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { updateGridData } from '@common/utils/common.utils';

@Component({
  standalone: false,
  selector: 'app-add-edit-process-profile-rule-modal',
  templateUrl: './add-edit-process-profile-rule-modal.component.html',
  styleUrls: ['./add-edit-process-profile-rule-modal.component.scss'],
})
export class AddEditProcessProfileRuleModalComponent implements OnInit {
  public processProfileRule;
  public readonly type: string = '';
  public groupOptions: Array<string>;
  public isAllowed: Boolean = true;
  public processProfileRuleForm: FormGroup;
  public oldData: any = {};

  constructor(
    public dialogRef: MatDialogRef<AddEditProcessProfileRuleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private processProfileRulesService: ProcessProfileRulesService,
    private groupsService: GroupsService,
    private translate: TranslateService,
    private utils: UtilsService,
    private notificationService: NotificationService
  ) {
    this.type = this.data.type;
  }

  ngOnInit(): void {
    this.processProfileRuleForm = new FormGroup({
      group: new FormControl(
        {
          value: '',
          disabled:
            this.type === GlobalConstant.MODAL_OP.EDIT ||
            this.data.source === GlobalConstant.NAV_SOURCE.GROUP,
        },
        [Validators.required]
      ),
      name: new FormControl('', Validators.required),
      path: new FormControl(''),
    });
    this.initializeVM();
    this.getGroupOptions();
  }

  onCancel() {
    this.dialogRef.close();
  }

  getGroupOptions() {
    this.groupsService
      .getGroupList(
        this.data.source === GlobalConstant.NAV_SOURCE.FED_POLICY
          ? GlobalConstant.SCOPE.FED
          : GlobalConstant.SCOPE.LOCAL
      )
      .subscribe(
        response => {
          this.groupOptions = response['groups']
            .map(group => group.name)
            .filter(group => group !== GlobalConstant.EXTERNAL);
        },
        err => {
          console.warn(err);
        }
      );
  }

  initializeVM() {
    if (this.type === GlobalConstant.MODAL_OP.ADD) {
      this.processProfileRuleForm.reset();
    } else {
      this.oldData = this.data.oldData[0];
      Object.keys(this.oldData).forEach((key: string) => {
        if (this.processProfileRuleForm.get(key)) {
          this.processProfileRuleForm
            .get(key)!
            .setValue(this.oldData ? this.oldData[key] : null);
        }
      });
      this.isAllowed =
        this.oldData.action ===
        GlobalConstant.PROCESS_PROFILE_RULE.ACTION.ALLOW;
    }
    if (!this.processProfileRuleForm.get('group')!.value) {
      this.processProfileRuleForm
        .get('group')!
        .setValue(this.data.groupName || '');
    }
  }

  addEditProcessProfileRule() {
    let typeText =
      this.type === GlobalConstant.MODAL_OP.ADD
        ? ['added', 'add']
        : ['updated', 'update'];
    let newData = {
      action: this.isAllowed
        ? GlobalConstant.PROCESS_PROFILE_RULE.ACTION.ALLOW
        : GlobalConstant.PROCESS_PROFILE_RULE.ACTION.DENY,
      ...this.processProfileRuleForm.value,
      last_modified_timestamp: new Date().getTime() / 1000,
    };

    newData.cfg_type =
      this.data.source === GlobalConstant.NAV_SOURCE.FED_POLICY
        ? GlobalConstant.CFG_TYPE.FED
        : GlobalConstant.CFG_TYPE.CUSTOMER;

    newData.group = this.processProfileRuleForm.get('group')!.value;

    this.processProfileRulesService
      .updateProcessProfileRules(
        this.type === GlobalConstant.MODAL_OP.ADD
          ? GlobalConstant.CRUD.C
          : GlobalConstant.CRUD.U,
        this.processProfileRuleForm.get('group')!.value,
        newData,
        this.oldData,
        this.data.source === GlobalConstant.NAV_SOURCE.FED_POLICY
          ? GlobalConstant.SCOPE.FED
          : GlobalConstant.SCOPE.LOCAL
      )
      .subscribe(
        response => {
          let msgTitle =
            this.type === GlobalConstant.MODAL_OP.ADD
              ? this.translate.instant('group.profile.ADD_OK')
              : this.translate.instant('group.profile.EDIT_OK');
          this.notificationService.open(msgTitle);
          updateGridData(
            this.data.processProfileRules,
            [newData],
            this.data.gridApi,
            ['name', 'path'],
            this.data.type,
            [this.oldData],
            true
          );
          this.onCancel();
        },
        error => {
          let msgTitle =
            this.type === GlobalConstant.MODAL_OP.ADD
              ? this.translate.instant('group.profile.ADD_NG')
              : this.translate.instant('group.profile.EDIT_NG');
          this.notificationService.openError(error.error, msgTitle);
        }
      );
  }
}
