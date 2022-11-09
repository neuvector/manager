import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalConstant } from '@common/constants/global.constant';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FileAccessRulesService } from '@services/file-access-rules.service';
import { GroupsService } from '@services/groups.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-add-edit-file-access-rule-modal',
  templateUrl: './add-edit-file-access-rule-modal.component.html',
  styleUrls: ['./add-edit-file-access-rule-modal.component.scss'],
})
export class AddEditFileAccessRuleModalComponent implements OnInit {
  public fileAccessRule: any;
  public readonly type: string = '';
  public groupOptions: Array<string>;
  public actionEnum = GlobalConstant.FILE_ACCESS_RULE.BEHAVIOR;
  public formControl4Apps = new FormControl();
  public separatorKeysCodes: number[] = [ENTER, COMMA];
  public fileAccessRuleForm: FormGroup;
  public applicationChipsArray: Array<string> = [];

  @ViewChild('appsInput', { static: false })
  appsInput: ElementRef<HTMLInputElement>;
  constructor(
    public dialogRef: MatDialogRef<AddEditFileAccessRuleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fileAccessRulesService: FileAccessRulesService,
    private groupsService: GroupsService,
    private utils: UtilsService
  ) {
    this.type = this.data.type;
  }

  ngOnInit() {
    this.fileAccessRuleForm = new FormGroup({
      group: new FormControl(
        { value: '', disabled: this.type === GlobalConstant.MODAL_OP.EDIT || this.data.source === GlobalConstant.NAV_SOURCE.GROUP },
        [Validators.required]
      ),
      filter: new FormControl(
        { value: '', disabled: this.type === GlobalConstant.MODAL_OP.EDIT },
        [Validators.required, Validators.pattern('^/.*')]
      ),
      recursive: new FormControl(false),
      behavior: new FormControl(
        null,
        [Validators.required]
      ),
      applications: new FormControl([]),
    });
    this.initializeVM();
    this.getGroupOptions();
  }

  onCancel() {
    this.dialogRef.close();
  }

  initializeVM = () => {
    if (this.type === GlobalConstant.MODAL_OP.ADD) {
      // this.fileAccessRuleForm.reset();
    } else {
      Object.keys(this.data.selectedRule).forEach((key: string) => {
        if (this.fileAccessRuleForm.controls[key]) {
          this.fileAccessRuleForm.controls[key].setValue(
            this.data.selectedRule ? this.data.selectedRule[key] : null
          );
        }
      });
      this.applicationChipsArray = cloneDeep(
        this.fileAccessRuleForm.controls.applications.value
      );
      this.fileAccessRuleForm.controls.applications.setValue(null);

      console.log(this.data.selectedRule, this.fileAccessRuleForm.value);
    }
    if (!this.fileAccessRuleForm.controls.group.value) {
      this.fileAccessRuleForm.controls.group.setValue(this.data.groupName || "");
    }
  };

  getGroupOptions() {
    this.groupsService.getGroupList(
      this.data.source === GlobalConstant.NAV_SOURCE.FED_POLICY ?
      GlobalConstant.SCOPE.FED :
      GlobalConstant.SCOPE.LOCAL
    ).subscribe(
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

  addAppIntoChip = (event: MatChipInputEvent): void => {
    const input = event.input;
    const value = event.value;
    if ((value || '').trim()) {
      this.applicationChipsArray.push(value.trim());
      this.fileAccessRuleForm.controls.applications.setValue(
        this.applicationChipsArray
      );
    }

    if (input) {
      input.value = '';
    }
    this.fileAccessRuleForm.controls.applications.setValue(null);
  };

  removeAppFromChip = (app: string): void => {
    const index = this.applicationChipsArray.indexOf(app);

    if (index >= 0) {
      this.applicationChipsArray.splice(index, 1);
      this.fileAccessRuleForm.controls.applications.setValue(null);
    }
  };

  addEditFileAccessRule = () => {
    let typeText =
      this.type === GlobalConstant.MODAL_OP.ADD
        ? ['added', 'add']
        : ['updated', 'update'];
    let fileAccessRuleData = {
      applications: this.applicationChipsArray,
      ...this.fileAccessRuleForm.value,
    };

    fileAccessRuleData.group = this.fileAccessRuleForm.controls.group.value;
    fileAccessRuleData.filter = this.fileAccessRuleForm.controls.filter.value;
    fileAccessRuleData.recursive = this.fileAccessRuleForm.controls.recursive.value;
    fileAccessRuleData.applications = this.applicationChipsArray;

    this.fileAccessRulesService
      .updateFileAccessRuleList(
        this.type === GlobalConstant.MODAL_OP.ADD
          ? GlobalConstant.CRUD.C
          : GlobalConstant.CRUD.U,
        fileAccessRuleData,
        this.fileAccessRuleForm.controls.group.value
      )
      .subscribe(
        response => {
          setTimeout(() => {
            this.data.getFileAccessRules(this.data.groupName);
          }, 1000);
          this.onCancel();
          // sweetAlert(
          //   `${UtilsService.capitalizeWord(typeText[0])}!`,
          //   `Your file access rule has been ${typeText[0]}.`,
          //   "success"
          // );
        },
        err => {
          if (
            err.status !== GlobalConstant.STATUS_AUTH_TIMEOUT &&
            err.status !== GlobalConstant.STATUS_UNAUTH &&
            err.status !== GlobalConstant.STATUS_SERVER_UNAVAILABLE
          ) {
            let message = this.utils.getErrorMessage(err);
            // sweetAlert(
            //   "Error!",
            //   `Something wrong when ${
            //     typeText[1]
            //   } file access rule! - ${message}`,
            //   "error"
            // );
          }
        }
      );
  };
}
