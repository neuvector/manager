import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { GlobalConstant } from '@common/constants/global.constant';
import { MatChipInputEvent } from '@angular/material/chips';
import { GroupsService } from '@services/groups.service';

@Component({
  selector: 'app-add-edit-group-modal',
  templateUrl: './add-edit-group-modal.component.html',
  styleUrls: ['./add-edit-group-modal.component.scss']
})
export class AddEditGroupModalComponent implements OnInit {

  modalOp: any;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  addEditGroupForm: FormGroup;
  criteria: Array<any> = [];
  submittingUpdate: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddEditGroupModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private groupsService: GroupsService
  ) { }

  ngOnInit(): void {
    this.modalOp = GlobalConstant.MODAL_OP;
    if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
      this.addEditGroupForm = new FormGroup({
        name: new FormControl(
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
        comment: new FormControl(''),
        criteriaCtrl: new FormControl()
      });
    } else {
      this.addEditGroupForm = new FormGroup({
        name: new FormControl(this.data.selectedGroup.name, Validators.required),
        comment: new FormControl(this.data.selectedGroup.comment),
        criteriaCtrl: new FormControl()
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

  updateRule = () => {
    console.log(this.addEditGroupForm.value);
    let payload = {
      ...this.addEditGroupForm.value,
      criteria: this.criteria,
      cfg_type: this.data.cfgType
    }
    this.groupsService.insertUpdateGroupData(payload, this.data.opType,)
      .subscribe(
        response => {
          this.data.refresh();
          this.dialogRef.close(true);
        },
        error => {}
      )
  };

}
