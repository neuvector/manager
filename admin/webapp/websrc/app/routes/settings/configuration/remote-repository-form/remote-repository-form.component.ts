import {
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { cloneDeep } from 'lodash';
import { ErrorResponse, RemoteRepository } from '@common/types';
import { RemoteRepoFormConfig } from './remote-repository-form-config';
import { SettingsService } from '@services/settings.service';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  selector: 'app-remote-repository-form',
  templateUrl: './remote-repository-form.component.html',
  styleUrls: ['./remote-repository-form.component.scss'],
})
export class RemoteRepositoryFormComponent implements OnInit {
  personalAccessTokenPlaceholder = '**********';
  remoteRepoForm = new FormGroup({});
  remoteRepoFields = cloneDeep(RemoteRepoFormConfig);
  serverErrorMessage: SafeHtml = '';
  submittingForm = false;
  removingRemoteRepo = false;
  isEdit = false;
  remoteRepoModel: any = {};
  @ViewChild(FormGroupDirective)
  formGroupDirective!: FormGroupDirective;
  @Input() remoteRepoData: RemoteRepository | undefined;

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private utils: UtilsService,
    private domSanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.isEdit = this.remoteRepoData ? true : false;

    // If we are editing, we want to show the personal access token placeholder.
    if (this.isEdit) {
      this.remoteRepoModel = {
        ...this.remoteRepoData,
      };
      this.remoteRepoModel.github_configuration.personal_access_token =
        this.personalAccessTokenPlaceholder;
    }
  }

  removeRemoteRepo(): void {
    this.removingRemoteRepo = true;
    this.settingsService
      .deleteRemoteRepositoryByName('default')
      .pipe(finalize(() => (this.removingRemoteRepo = false)))
      .subscribe(
        () => {
          this.notificationService.open(
            this.translateService.instant(
              'setting.remote_repository.delete_success'
            )
          );
          this.settingsService.refreshConfig();
        },
        (error: ErrorResponse) => {
          if (
            error.message &&
            error.message.length > GlobalConstant.MAX_ERROR_MESSAGE_LENGTH
          ) {
            this.serverErrorMessage = this.domSanitizer.bypassSecurityTrustHtml(
              error.message
            );
          }
          this.notificationService.open(
            this.serverErrorMessage
              ? this.translateService.instant('setting.REMOVE_ERROR')
              : this.utils.getAlertifyMsg(
                  error,
                  this.translateService.instant('setting.REMOVE_ERROR'),
                  false
                ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      );
  }
  submit(): void {
    let payload: RemoteRepository = this.transformToPayload(
      this.remoteRepoForm.value
    );
    // If the user didn't change the personal access token, we don't want to send it to the server.
    if (
      this.isEdit &&
      this.remoteRepoForm.get('github_configuration.personal_access_token')
        ?.pristine
    ) {
      payload.github_configuration.personal_access_token = null as any;
    }

    this.submittingForm = true;
    this.settingsService
      .updateRemoteRepository(payload, this.isEdit)
      .pipe(
        finalize(() => {
          this.submittingForm = false;
          this.remoteRepoForm.markAsPristine();
        })
      )
      .subscribe(
        () => {
          this.notificationService.open(
            this.translateService.instant('setting.SUBMIT_OK')
          );
          this.isEdit = true;
        },
        (error: ErrorResponse) => {
          if (
            error.message &&
            error.message.length > GlobalConstant.MAX_ERROR_MESSAGE_LENGTH
          ) {
            this.serverErrorMessage = this.domSanitizer.bypassSecurityTrustHtml(
              error.message
            );
          }

          this.notificationService.open(
            this.serverErrorMessage
              ? this.translateService.instant('setting.SUBMIT_FAILED')
              : this.utils.getAlertifyMsg(
                  error,
                  this.translateService.instant('setting.SUBMIT_FAILED'),
                  false
                ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      );
  }

  private transformToPayload(form: any): RemoteRepository {
    return {
      nickname: 'default',
      provider: 'github',
      ...form,
    };
  }
}
