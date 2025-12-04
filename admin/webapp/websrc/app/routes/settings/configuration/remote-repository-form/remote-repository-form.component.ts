import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { cloneDeep } from 'lodash';
import {
  ErrorResponse,
  RemoteRepository,
  RepositoryUpdateOptions,
} from '@common/types';
import { RemoteRepoFormConfig } from './remote-repository-form-config';
import { SettingsService } from '@services/settings.service';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  standalone: false,
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
  remoteRepositoryProvider: string | undefined;

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private utils: UtilsService,
    private domSanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.initializeEditMode();
    this.remoteRepoModel.providerTypes =
      GlobalConstant.REMOTE_REPOSITORY_PROVIDER_TYPES;
    this.remoteRepositoryProvider = this.remoteRepoData?.provider;
  }

  private initializeEditMode(): void {
    this.isEdit = !!this.remoteRepoData;
    if (!this.isEdit) return;

    this.remoteRepoModel = {
      ...this.remoteRepoData,
      github_configuration: {
        ...(this.remoteRepoData?.github_configuration || {}),
      },
      azure_devops_configuration: {
        ...(this.remoteRepoData?.azure_devops_configuration || {}),
      },
    };

    if (this.remoteRepoModel.provider == GlobalConstant.PROVIDER_VALUES.GITHUB)
      this.remoteRepoModel.github_configuration.personal_access_token =
        this.personalAccessTokenPlaceholder;
    if (
      this.remoteRepoModel.provider ==
      GlobalConstant.PROVIDER_VALUES.AZURE_DEVOPS
    )
      this.remoteRepoModel.azure_devops_configuration.personal_access_token =
        this.personalAccessTokenPlaceholder;
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
    const payload: RemoteRepository = this.prepareRepositoryPayload(
      this.remoteRepoForm.value
    );
    const updateOptions = this.getRepositoryUpdateOptions(payload);

    // If the user didn't change the personal access token, we don't want to send it to the server.
    if (this.isEdit) {
      if (
        payload.provider == GlobalConstant.PROVIDER_VALUES.GITHUB &&
        this.remoteRepoForm.get('github_configuration.personal_access_token')
          ?.pristine
      )
        payload.github_configuration.personal_access_token = null as any;
      if (
        payload.provider == GlobalConstant.PROVIDER_VALUES.AZURE_DEVOPS &&
        this.remoteRepoForm.get(
          'azure_devops_configuration.personal_access_token'
        )?.pristine
      )
        payload.azure_devops_configuration.personal_access_token = null as any;
    }

    this.submittingForm = true;
    this.settingsService
      .updateRemoteRepository(payload, updateOptions)
      .pipe(finalize(() => this.handleSubmissionFinalization()))
      .subscribe(
        () => {
          this.notificationService.open(
            this.translateService.instant('setting.SUBMIT_OK')
          );
          this.isEdit = true;
          this.remoteRepositoryProvider = payload.provider;
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

  private prepareRepositoryPayload(form: any): RemoteRepository {
    return {
      nickname: 'default',
      ...form,
    };
  }

  private getRepositoryUpdateOptions(
    payload: RemoteRepository
  ): RepositoryUpdateOptions {
    return {
      isEdit: this.isEdit,
      requiresRecreate: payload.provider !== this.remoteRepositoryProvider,
    };
  }

  private handleSubmissionFinalization(): void {
    this.submittingForm = false;
    this.remoteRepoForm.markAsPristine();
  }
}
