import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Component({
  standalone: false,
  selector: 'app-export-form',
  templateUrl: './export-form.component.html',
  styleUrls: ['./export-form.component.scss'],
  
})
export class ExportFormComponent implements OnInit {
  @Input() source = GlobalConstant.NAV_SOURCE.SELF;
  serverErrorMessage: SafeHtml = '';
  GlobalConstant = GlobalConstant;
  submittingForm = false;
  errorMsg: string = '';
  exportForm = new FormGroup({
    export: new FormControl(null, Validators.required),
    as_standalone: new FormControl(false),
  });
  isExportAuthorized!: boolean;
  importMsg = {
    success: '',
    error: '',
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
    private notificationService: NotificationService,
    private domSanitizer: DomSanitizer
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
    this.importMsg = {
      success:
        this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
          ? this.tr.instant('setting.message.UPLOAD_FINISH_FED')
          : this.tr.instant('setting.message.UPLOAD_FINISH'),
      error: this.tr.instant('setting.IMPORT_FAILED'),
    };
  }

  submitExport(): void {
    this.submittingForm = true;
    this.errorMsg = '';

    if (this.source !== GlobalConstant.NAV_SOURCE.FED_POLICY) {
      const exportType: string = this.exportForm.get('export')?.value || '';

      this.settingsService
        .getSystemConfig(exportType)
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
              exportType && exportType.toLowerCase() === 'all'
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
    } else {
      const exportOptions: any =
        this.exportForm.get('export_options')?.value || {};
      const isRemote = exportOptions.export_mode === 'remote';

      let payload = {};

      if (isRemote) {
        payload = {
          remote_export_options: exportOptions,
        };
        this.settingsService.getFedSystemConfig(payload).subscribe(
          response => {
            const responseObj = JSON.parse(response.body as string);
            this.notificationService.open(
              `${this.tr.instant(
                'setting.message.EXPORT_OK'
              )} ${this.tr.instant('general.EXPORT_FILE')} ${
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
                ? this.tr.instant('setting.message.EXPORT_NG')
                : this.utils.getAlertifyMsg(error, '', false),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        );
      } else {
        this.settingsService.getFedSystemConfig(payload).subscribe(
          response => {
            let fileName = this.utils.getExportedFileName(response);
            let blob = new Blob([response.body || ''], {
              type: 'text/plain;charset=utf-8',
            });
            saveAs(blob, fileName);
            this.notificationService.open(
              this.tr.instant('setting.message.EXPORT_OK')
            );
          },
          error => {
            if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
              this.notificationService.open(
                this.utils.getAlertifyMsg(
                  error.error,
                  this.tr.instant('setting.message.EXPORT_NG'),
                  false
                ),
                GlobalConstant.NOTIFICATION_TYPE.ERROR
              );
            }
          }
        );
      }
    }
  }
}
