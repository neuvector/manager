import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorResponse } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { NotificationService } from '@services/notification.service';
import { SettingsService } from '@services/settings.service';
import { finalize } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { PathConstant } from '@common/constants/path.constant';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-export-form',
  templateUrl: './export-form.component.html',
  styleUrls: ['./export-form.component.scss'],
})
export class ExportFormComponent {
  submittingForm = false;
  exportForm = new FormGroup({
    export: new FormControl(null, Validators.required),
    as_standalone: new FormControl(false),
  });

  constructor(
    private settingsService: SettingsService,
    private tr: TranslateService,
    private utils: UtilsService,
    private notificationService: NotificationService
  ) {}

  get importUrl(): string {
    return PathConstant.SYSTEM_CONFIG_URL;
  }

  get as_standalone(): boolean {
    return this.exportForm.get('as_standalone')?.value;
  }

  submitExport(): void {
    const exportMode = this.exportForm.get('export')?.value;
    this.submittingForm = true;
    this.settingsService
      .getSystemConfig(exportMode)
      .pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      )
      .subscribe(
        data => {
          let exportUrl = new Blob([data], {
            type: 'application/zip',
          });
          let fileName =
            exportMode && exportMode.toLowerCase() === 'all'
              ? `NV${this.utils.parseDatetimeStr(new Date())}.conf.gz`
              : `NV${this.utils.parseDatetimeStr(new Date())}_policy.conf.gz`;
          saveAs(exportUrl, fileName);
        },
        ({ error }: { error: ErrorResponse }) => {
          this.notificationService.open(
            this.tr.instant('setting.EXPORT_FAILED')
          );
          console.warn(error);
        }
      );
  }
}
