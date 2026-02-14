import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AdmissionRulesService } from '@common/services/admission-rules.service';
import { UtilsService } from '@common/utils/app.utils';
import { finalize } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  standalone: false,
  selector: 'app-export-admission-rules-modal',
  templateUrl: './export-admission-rules-modal.component.html',
  styleUrls: ['./export-admission-rules-modal.component.scss'],
})
export class ExportAdmissionRulesModalComponent implements OnInit {
  GlobalConstant = GlobalConstant;
  submittingForm = false;
  exportForm: FormGroup;
  serverErrorMessage: SafeHtml = '';

  constructor(
    public dialogRef: MatDialogRef<ExportAdmissionRulesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private admissionRulesService: AdmissionRulesService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private translate: TranslateService,
    private fb: FormBuilder,
    private domSanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.exportForm = this.fb.group({
      isIncludingConfig: [false],
    });
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  submitExport = () => {
    const { export_mode, ...exportOptions } =
      this.exportForm.get('export_options')?.value;

    this.submittingForm = true;
    if (export_mode === 'local') {
      this.admissionRulesService
        .exportAdmissionRules(
          this.data.selectedAdmissionRules,
          this.exportForm.controls.isIncludingConfig.value,
          null,
          this.data.source
        )
        .pipe(
          finalize(() => {
            this.submittingForm = false;
          })
        )
        .subscribe(
          response => {
            let filename = this.utils.getExportedFileName(response);
            let blob = new Blob([response.body || ''], {
              type: 'text/plain;charset=utf-8',
            });
            saveAs(blob, filename);
            this.notificationService.open(
              this.translate.instant('admissionControl.msg.EXPORT_OK')
            );
          },
          error => {
            if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
              this.notificationService.open(
                this.utils.getAlertifyMsg(error.error, '', false),
                GlobalConstant.NOTIFICATION_TYPE.ERROR
              );
            }
          }
        );
    } else {
      this.admissionRulesService
        .exportAdmissionRules(
          this.data.selectedAdmissionRules,
          this.exportForm.controls.isIncludingConfig.value,
          exportOptions,
          this.data.source
        )
        .pipe(
          finalize(() => {
            this.submittingForm = false;
          })
        )
        .subscribe(
          response => {
            const responseObj = JSON.parse(response.body as string);
            this.notificationService.open(
              `${this.translate.instant(
                'admissionControl.msg.EXPORT_OK'
              )} ${this.translate.instant('general.EXPORT_FILE')} ${
                responseObj.file_path
              }`
            );
          },
          error => {
            if (
              error.message &&
              error.message.length > GlobalConstant.MAX_ERROR_MESSAGE_LENGTH
            ) {
              this.serverErrorMessage =
                this.domSanitizer.bypassSecurityTrustHtml(error.message);
            }

            this.notificationService.open(
              this.serverErrorMessage
                ? this.translate.instant('admissionControl.msg.EXPORT_NG')
                : this.utils.getAlertifyMsg(
                    error,
                    this.translate.instant('admissionControl.msg.EXPORT_NG'),
                    false
                  ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        );
    }
  };
}
