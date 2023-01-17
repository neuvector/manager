import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AdmissionRulesService } from "@common/services/admission-rules.service";
import { UtilsService } from "@common/utils/app.utils";
import { finalize } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';


@Component({
  selector: 'app-export-admission-rules-modal',
  templateUrl: './export-admission-rules-modal.component.html',
  styleUrls: ['./export-admission-rules-modal.component.scss'],
})
export class ExportAdmissionRulesModalComponent implements OnInit {

  submittingForm = false;
  exportForm: UntypedFormGroup;

  constructor(
    public dialogRef: MatDialogRef<ExportAdmissionRulesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private admissionRulesService: AdmissionRulesService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.exportForm = new UntypedFormGroup({
      isIncludingConfig: new UntypedFormControl(false)
    });
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  submitExport = () => {
    this.submittingForm = true;
    this.admissionRulesService
      .exportAdmissionRules(this.data.selectedAdmissionRules, this.exportForm.controls.isIncludingConfig.value)
      .pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      )
      .subscribe(
        response => {
          let filename = this.utils.getExportedFileName(response);
          let blob = new Blob([response.body || ""], {
            type: "text/plain;charset=utf-8"
          });
          saveAs(blob, filename);
          this.notificationService.open(this.translate.instant("admissionControl.msg.EXPORT_OK"));
        },
        error => {
          if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
            this.notificationService.open(
              this.utils.getAlertifyMsg(error.error, this.translate.instant("admissionControl.msg.EXPORT_OK"), false),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        }
      );
  };

}
