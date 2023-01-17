import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { UntypedFormControl, UntypedFormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { GlobalConstant } from '@common/constants/global.constant';
import { MatChipInputEvent } from '@angular/material/chips';
import { GroupsService } from '@services/groups.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';

@Component({
  selector: 'app-add-edit-group-modal',
  templateUrl: './add-edit-group-modal.component.html',
  styleUrls: ['./add-edit-group-modal.component.scss']
})
export class AddEditGroupModalComponent implements OnInit {

  modalOp: any;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  addEditGroupForm: UntypedFormGroup;
  criteria: Array<any> = [];
  submittingUpdate: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddEditGroupModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private groupsService: GroupsService,
    private translate: TranslateService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.modalOp = GlobalConstant.MODAL_OP;
    if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
      this.addEditGroupForm = new UntypedFormGroup({
        name: new UntypedFormControl(
          this.data.cfgType === GlobalConstant.CFG_TYPE.FED
            ? 'fed.'
            : '',
          this.data.cfgType === GlobalConstant.CFG_TYPE.FED
            ? [
                Validators.required,
                this.fedNameValidator()
              ]
            : Validators.required
        ),
        comment: new UntypedFormControl(''),
        criteriaCtrl: new UntypedFormControl()
      });
    } else {
      this.addEditGroupForm = new UntypedFormGroup({
        name: new UntypedFormControl(this.data.selectedGroup.name, Validators.required),
        comment: new UntypedFormControl(this.data.selectedGroup.comment),
        criteriaCtrl: new UntypedFormControl()
      });
      this.criteria = this.data.selectedGroup.criteria;
      if (this.data.opType === GlobalConstant.MODAL_OP.VIEW) {
        this.addEditGroupForm.controls.criteriaCtrl.disable();
      } else {
        this.addEditGroupForm.controls.criteriaCtrl.enable();
      }
    }
  }

  fedNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isValid = control.value.startsWith('fed.');
      return isValid ? null : {fedName: {value: control.value}};
    };
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  addCriterion = (event: MatChipInputEvent) => {
    const value = (event.value || '').trim();
    if (value) {
      this.criteria.push({name: value});
    }

    event.chipInput!.clear();
  };

  removeCriterion = (criterion: string) => {
    const index = this.criteria.indexOf(criterion);
    if (index >= 0) {
      this.criteria.splice(index, 1);
    }
  };

  updateGroup = () => {
    console.log(this.addEditGroupForm.value);
    let payload = {
      ...this.addEditGroupForm.value,
      criteria: this.criteria,
      cfg_type: this.data.cfgType
    }
    this.groupsService.insertUpdateGroupData(payload, this.data.opType)
      .subscribe(
        response => {
          let msgTitle = this.data.opType === GlobalConstant.MODAL_OP.ADD ?
            this.translate.instant('group.addGroup.OK_MSG') :
            this.translate.instant('group.editGroup.OK_MSG');
          this.notificationService.open(msgTitle);
          setTimeout(() => {
            this.data.refresh();
          }, 1000);
          this.dialogRef.close(true);
        },
        error => {
          let msgTitle = this.data.opType === GlobalConstant.MODAL_OP.ADD ?
            this.translate.instant('group.addGroup.ERR_MSG') :
            this.translate.instant('group.editGroup.ERR_MSG');
          this.notificationService.openError(error, msgTitle);
        }
      )
  };

}
