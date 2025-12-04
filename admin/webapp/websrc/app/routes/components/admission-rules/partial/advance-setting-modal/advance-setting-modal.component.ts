import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AdmissionRulesService } from '@common/services/admission-rules.service';
import { cloneDeep } from 'lodash';
import { finalize } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { UtilsService } from '@common/utils/app.utils';


@Component({
  standalone: false,
  selector: 'app-advance-setting-modal',
  templateUrl: './advance-setting-modal.component.html',
  styleUrls: ['./advance-setting-modal.component.scss'],
  
})
export class AdvanceSettingModalComponent implements OnInit {
  clientModeFormGroup: FormGroup;
  submittingForm: boolean;
  submittingTest: boolean;
  isTestCompleted: boolean;
  isTestOK: boolean;
  testErrMsg: string;

  constructor(
    public dialogRef: MatDialogRef<AdvanceSettingModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private admissionRulesService: AdmissionRulesService,
    private utils: UtilsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.clientModeFormGroup = new FormGroup({
      clientModeFormControl: new FormControl(this.data.state.adm_client_mode),
    });
    this.submittingForm = false;
    this.submittingTest = false;
    this.isTestCompleted = false;
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  submitClientMode = () => {
    let state = cloneDeep(this.data.state);
    state.adm_client_mode =
      this.clientModeFormGroup.controls.clientModeFormControl.value;
    this.submittingForm = true;
    this.admissionRulesService
      .updateAdmissionState({ state: state })
      .pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      )
      .subscribe(
        response => {
          this.data.refreshFn();
          this.clientModeFormGroup.markAsPristine();
        },
        error => {}
      );
  };

  testK8s = () => {
    this.submittingTest = true;
    this.admissionRulesService
      .doK8sTest()
      .pipe(
        finalize(() => {
          this.submittingTest = false;
          this.isTestCompleted = true;
        })
      )
      .subscribe(
        response => {
          this.isTestOK = true;
        },
        error => {
          this.isTestOK = false;
          if (error.status === GlobalConstant.STATUS_NOT_FOUND) {
            switch (error.error.code) {
              case GlobalConstant.ADMISSION.INTERNAL_ERR_CODE
                .CLUSTER_ROLE_NOT_CONFIG:
                this.testErrMsg = this.translate.instant(
                  'partner.admissionControl.msg.CLUSTER_ROLE_NOT_CONFIG'
                );
                break;
              case GlobalConstant.ADMISSION.INTERNAL_ERR_CODE
                .WEBHOOK_NOT_CONFIG:
                this.testErrMsg = this.translate.instant(
                  'partner.admissionControl.msg.WEBHOOK_NOT_CONFIG'
                );
                break;
              case GlobalConstant.ADMISSION.INTERNAL_ERR_CODE.NO_UPD_PROMISSION:
                this.testErrMsg = this.translate.instant(
                  'partner.admissionControl.msg.NO_UPD_PROMISSION'
                );
                break;
              case GlobalConstant.ADMISSION.INTERNAL_ERR_CODE.ERR_SRV2WEBHOOK:
                this.testErrMsg = this.translate.instant(
                  'admissionControl.msg.ERR_SRV2WEBHOOK'
                );
                break;
              default:
                this.testErrMsg = this.utils.getErrorMessage(error);
            }
          }
        }
      );
  };
}
