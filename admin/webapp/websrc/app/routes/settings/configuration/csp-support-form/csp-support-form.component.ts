import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '@services/settings.service';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import { finalize } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { NotificationService } from '@services/notification.service';
import * as moment from 'moment';


@Component({
  standalone: false,
  selector: 'app-csp-support-form',
  templateUrl: './csp-support-form.component.html',
  styleUrls: ['./csp-support-form.component.scss'],
  
})
export class CspSupportFormComponent implements OnInit {
  @Input() cspType: string;

  cspTypeText: string;
  submittingForm = false;
  errorMsg: string = '';
  cspAdapterErrorMsgObj: any = null;
  cspErrors: string[] = [];
  nvError: string = '';
  billingDataExpireTime: string = '';
  cspExportForm = new FormGroup({
    export: new FormControl(null, Validators.required),
  });

  constructor(
    private settingsService: SettingsService,
    private tr: TranslateService,
    private utils: UtilsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cspTypeText = this.tr.instant(
      `setting.cloud_type.${this.cspType.toUpperCase()}`
    );
  }

  submitExport = () => {
    this.submittingForm = true;
    this.errorMsg = '';
    this.cspErrors = [];
    this.nvError = '';
    this.billingDataExpireTime = '';
    let cspAdapterErrorsBase64 = null;
    this.settingsService
      .getCspSupport()
      .pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      )
      .subscribe(
        response => {
          let exportUrl = new Blob([response['body'] || ''], {
            type: 'application/zip',
          });
          let fileName = `${this.utils.getExportedFileName(response)}`;
          cspAdapterErrorsBase64 = response['headers'].get(
            'X-Nv-Csp-Adapter-Errors'
          );
          this.cspAdapterErrorMsgObj = cspAdapterErrorsBase64
            ? JSON.parse(atob(cspAdapterErrorsBase64))
            : null;
          if (this.cspAdapterErrorMsgObj) {
            if (this.cspAdapterErrorMsgObj.csp_errors) {
              this.cspErrors = this.cspAdapterErrorMsgObj.csp_errors.map(
                cspError => cspError.split('\n')
              );
            }
            if (this.cspAdapterErrorMsgObj.nv_error) {
              this.nvError = this.cspAdapterErrorMsgObj.nv_error;
            }
            if (this.cspAdapterErrorMsgObj.billing_data_expire_time) {
              this.billingDataExpireTime = moment(
                this.cspAdapterErrorMsgObj.billing_data_expire_time * 1000
              ).format('MM/DD/YYYY hh:mm:ss');
            }
          }
          saveAs(exportUrl, fileName);
          this.notificationService.open(this.tr.instant('setting.EXPORT_OK'));
        },
        error => {
          console.warn(error);
          this.errorMsg = error.error;
        }
      );
  };
}
