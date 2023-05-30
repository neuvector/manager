import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '@services/settings.service';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import { finalize } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { GlobalConstant } from '@common/constants/global.constant';
import { NotificationService } from '@services/notification.service';
import { ErrorResponse } from '@common/types';

@Component({
  selector: 'app-csp-support-form',
  templateUrl: './csp-support-form.component.html',
  styleUrls: ['./csp-support-form.component.scss']
})
export class CspSupportFormComponent implements OnInit {

  submittingForm = false;
  errorMsg: string = '';
  cspExportForm = new FormGroup({
    export: new FormControl(null, Validators.required)
  });

  constructor(
    private settingsService: SettingsService,
    private tr: TranslateService,
    private utils: UtilsService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
  }

  submitExport = () => {
    this.submittingForm = true;
    this.errorMsg = '';
    this.settingsService
      .getCspSupport()
      .pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      )
      .subscribe(
        response => {
          let exportUrl = new Blob([response['body'] || ""], {
            type: 'application/zip',
          });
          let fileName = `${this.utils.getExportedFileName(response)}`;
          saveAs(exportUrl, fileName);
          this.notificationService.open(
            this.tr.instant('setting.EXPORT_OK')
          );
        },
        error => {
          console.warn(error);
          this.errorMsg = error.error;
        }
      );
  }

}
