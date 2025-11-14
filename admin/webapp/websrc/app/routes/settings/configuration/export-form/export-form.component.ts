import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorResponse } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { NotificationService } from '@services/notification.service';
import { SettingsService } from '@services/settings.service';
import { finalize } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { PathConstant } from '@common/constants/path.constant';
import { TranslateService } from '@ngx-translate/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { MapConstant } from '@common/constants/map.constant';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  selector: 'app-export-form',
  templateUrl: './export-form.component.html',
  styleUrls: ['./export-form.component.scss'],
})
export class ExportFormComponent implements OnInit {
  @Input() source = GlobalConstant.NAV_SOURCE.SELF;
  GlobalConstant = GlobalConstant;
  submittingForm = false;
  errorMsg: string = '';
  exportForm = new FormGroup({
    export: new FormControl(null, Validators.required),
    as_standalone: new FormControl(false),
  });
  isExportAuthorized!: boolean;
  importMsg = {
    success:
      this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
        ? this.tr.instant('setting.message.UPLOAD_FINISH_FED')
        : this.tr.instant('setting.message.UPLOAD_FINISH'),
    error: this.tr.instant('setting.IMPORT_FAILED'),
  };
  get isImportAuthorized() {
    return (
      GlobalVariable.user.token.role === MapConstant.FED_ROLES.FEDADMIN ||
      (GlobalVariable.user.token.role === MapConstant.FED_ROLES.ADMIN &&
        (GlobalVariable.isStandAlone || GlobalVariable.isMember))
    );
  }

  constructor(
    private settingsService: SettingsService,
    private tr: TranslateService,
    private utils: UtilsService,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService
  ) {}

  get importUrl(): string {
    return this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
      ? PathConstant.SYSTEM_CONFIG_FED_URL
      : PathConstant.SYSTEM_CONFIG_URL;
  }

  get as_standalone(): boolean {
    return this.exportForm.get('as_standalone')?.value || false;
  }

  ngOnInit(): void {
    this.isExportAuthorized =
      this.authUtilsService.getDisplayFlag('write_config');
  }

  submitExport(): void {
    const exportMode: string = this.exportForm.get('export')?.value || '';
    this.submittingForm = true;
    this.errorMsg = '';
    if (this.source === GlobalConstant.NAV_SOURCE.FED_POLICY) {
      this.settingsService.getFedSystemConfig().subscribe(response => {
        let fileName = this.utils.getExportedFileName(response);
        let blob = new Blob([response.body || ''], {
          type: 'text/plain;charset=utf-8',
        });
        saveAs(blob, fileName);
        this.notificationService.open(
          this.tr.instant('waf.msg.EXPORT_SENSOR_OK')
        );
      });
    } else {
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
            this.notificationService.open(this.tr.instant('setting.EXPORT_OK'));
          },
          error => {
            console.warn(error);
            this.errorMsg = error.error;
          }
        );
    }
  }
}
