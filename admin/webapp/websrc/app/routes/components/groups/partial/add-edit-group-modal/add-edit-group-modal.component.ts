import { Component, OnInit, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  FormControl,
  FormGroup,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { MatChipInputEvent } from '@angular/material/chips';
import { GroupsService } from '@services/groups.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { InputDialogComponent } from '@components/ui/input-dialog/input-dialog.component';
import { validTypingOnly } from '@common/utils/common.utils';


@Component({
  standalone: false,
  selector: 'app-add-edit-group-modal',
  templateUrl: './add-edit-group-modal.component.html',
  styleUrls: ['./add-edit-group-modal.component.scss'],
  
})
export class AddEditGroupModalComponent implements OnInit {
  modalOp: any;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  addEditGroupForm: FormGroup;
  criteria: Array<any> = [];
  submittingUpdate: boolean = false;
  groupNameRegex = new RegExp(/^[a-z0-9.-]*$/);
  isShowingWarning: boolean = false;
  showMonitorMetric: boolean = true;
  GlobalConstant = GlobalConstant;

  constructor(
    public dialogRef: MatDialogRef<AddEditGroupModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private groupsService: GroupsService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.modalOp = GlobalConstant.MODAL_OP;
    if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
      this.addEditGroupForm = new FormGroup({
        name: new FormControl(
          this.data.cfgType === GlobalConstant.CFG_TYPE.FED ? 'fed.' : '',
          this.data.cfgType === GlobalConstant.CFG_TYPE.FED
            ? [Validators.required, this.fedNameValidator()]
            : Validators.required
        ),
        comment: new FormControl(''),
        criteriaCtrl: new FormControl(),
        monitor_metric: new FormControl(false, Validators.required),
        group_sess_rate: new FormControl(0, Validators.required),
        group_sess_cur: new FormControl(0, Validators.required),
        group_band_width: new FormControl(0, Validators.required),
      });
      this.showMonitorMetric =
        this.data.cfgType === GlobalConstant.CFG_TYPE.CUSTOMER ||
        this.data.cfgType === GlobalConstant.CFG_TYPE.GROUND ||
        this.data.source === GlobalConstant.NAV_SOURCE.FED_POLICY;
    } else {
      this.addEditGroupForm = new FormGroup({
        name: new FormControl(
          this.data.selectedGroup.name,
          Validators.required
        ),
        comment: new FormControl(this.data.selectedGroup.comment),
        criteriaCtrl: new FormControl(),
        monitor_metric: new FormControl(
          this.data.selectedGroup.monitor_metric,
          Validators.required
        ),
        group_sess_rate: new FormControl(
          this.data.selectedGroup.group_sess_rate,
          Validators.required
        ),
        group_sess_cur: new FormControl(
          this.data.selectedGroup.group_sess_cur,
          Validators.required
        ),
        group_band_width: new FormControl(
          this.data.selectedGroup.group_band_width,
          Validators.required
        ),
      });
      this.isShowingWarning = !this.groupNameRegex.test(
        this.addEditGroupForm.get('name')!.value
      );
      this.criteria = JSON.parse(
        JSON.stringify(this.data.selectedGroup.criteria)
      );
      if (
        this.data.opType === GlobalConstant.MODAL_OP.VIEW ||
        this.data.cfgType === GlobalConstant.CFG_TYPE.LEARNED
      ) {
        this.addEditGroupForm.controls.criteriaCtrl.disable();
      } else {
        this.addEditGroupForm.controls.criteriaCtrl.enable();
      }
      this.showMonitorMetric =
        (this.data.cfgType === GlobalConstant.CFG_TYPE.LEARNED ||
          this.data.cfgType === GlobalConstant.CFG_TYPE.CUSTOMER ||
          this.data.cfgType === GlobalConstant.CFG_TYPE.GROUND ||
          this.data.cfgType === GlobalConstant.CFG_TYPE.FED) &&
        this.data.selectedGroup.kind === MapConstant.GROUP_KIND.CONTAINER &&
        !this.data.selectedGroup.reserved;
    }
  }

  fedNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isValid = control.value.startsWith('fed.');
      return isValid ? null : { fedName: { value: control.value } };
    };
  }

  checkGroupName = () => {
    this.isShowingWarning = !this.groupNameRegex.test(
      this.addEditGroupForm.get('name')!.value
    );
  };

  suppressInvalidTyping = event => {
    return validTypingOnly(event, /[a-z]|[A-Z]|[0-9]|\.|\-/);
  };

  onCancel = () => {
    this.dialogRef.close(false);
  };

  addCriterion = (event: MatChipInputEvent) => {
    const value = (event.value || '').trim();
    if (value) {
      this.criteria.push({ name: value });
    }

    event.chipInput!.clear();
    this.updateShowMonitorMetric();
  };

  removeCriterion = (criterion: string) => {
    const index = this.criteria.indexOf(criterion);
    if (index >= 0) {
      this.criteria.splice(index, 1);
    }
    this.updateShowMonitorMetric();
  };

  editCriterion = (criterion: any) => {
    const index = this.criteria.indexOf(criterion);
    const dialogRef = this.dialog.open(InputDialogComponent, {
      data: {
        input: criterion.name,
        title: this.translate.instant('group.EDIT_CRITERIA'),
      },
    });
    dialogRef.afterClosed().subscribe(input => {
      const value = (input || '').trim();
      if (value) {
        this.criteria[index].name = value;
      }
      this.updateShowMonitorMetric();
    });
  };

  private updateShowMonitorMetric = () => {
    if (!this.addEditGroupForm.controls['group_sess_rate'].value)
      this.addEditGroupForm.controls['group_sess_rate'].setValue(0);
    if (!this.addEditGroupForm.controls['group_sess_cur'].value)
      this.addEditGroupForm.controls['group_sess_cur'].setValue(0);
    if (!this.addEditGroupForm.controls['group_band_width'].value)
      this.addEditGroupForm.controls['group_band_width'].setValue(0);
    this.showMonitorMetric =
      (this.data.cfgType === GlobalConstant.CFG_TYPE.CUSTOMER ||
        this.data.cfgType === GlobalConstant.CFG_TYPE.LEARNED ||
        this.data.cfgType === GlobalConstant.CFG_TYPE.GROUND ||
        this.data.cfgType === GlobalConstant.CFG_TYPE.FED) &&
      ((this.data.opType === GlobalConstant.MODAL_OP.EDIT &&
        !this.data.selectedGroup.reserved) ||
        this.data.opType === GlobalConstant.MODAL_OP.ADD) &&
      this.criteria.filter(criterion => criterion.name.includes('address'))
        .length === 0;
  };

  updateGroup = () => {
    console.log(this.addEditGroupForm.value);
    let payload = {
      ...this.addEditGroupForm.value,
      criteria: this.criteria,
      cfg_type: this.data.cfgType,
    };
    this.groupsService
      .insertUpdateGroupData(payload, this.data.opType)
      .subscribe(
        response => {
          let msgTitle =
            this.data.opType === GlobalConstant.MODAL_OP.ADD
              ? this.translate.instant('group.addGroup.OK_MSG')
              : this.translate.instant('group.editGroup.OK_MSG');
          this.notificationService.open(msgTitle);
          setTimeout(() => {
            this.data.refresh();
          }, 1000);
          this.dialogRef.close(true);
        },
        error => {
          let msgTitle =
            this.data.opType === GlobalConstant.MODAL_OP.ADD
              ? this.translate.instant('group.addGroup.ERR_MSG')
              : this.translate.instant('group.editGroup.ERR_MSG');
          this.notificationService.openError(error.error, msgTitle);
        }
      );
  };
}
