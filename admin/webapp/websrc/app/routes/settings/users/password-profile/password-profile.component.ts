import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ErrorResponse, PasswordProfile } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { FormlyFormOptions } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { SettingsService } from '@services/settings.service';
import { cloneDeep } from 'lodash';
import { PwdProfileFormConfig } from './password-profile-config';
import { AuthUtilsService } from '@common/utils/auth.utils';

@Component({
  standalone: false,
  selector: 'app-password-profile',
  templateUrl: './password-profile.component.html',
  styleUrls: ['./password-profile.component.scss'],
})
export class PasswordProfileComponent implements OnInit {
  submittingForm = false;
  profileForm = new FormGroup({});
  profileFields = cloneDeep(PwdProfileFormConfig);
  profileOptions: FormlyFormOptions = {
    formState: {},
  };
  private _pwdProfile!: PasswordProfile;
  get passwordProfile(): PasswordProfile {
    return this._pwdProfile;
  }
  get pwdFormatValid() {
    const min_len = this.profileForm.get('min_len')?.value || 0,
      min_lowercase_count =
        this.profileForm.get('min_lowercase_count')?.value || 0,
      min_uppercase_count =
        this.profileForm.get('min_uppercase_count')?.value || 0,
      min_digit_count = this.profileForm.get('min_digit_count')?.value || 0,
      min_special_count = this.profileForm.get('min_special_count')?.value || 0;
    return (
      min_len >=
      min_lowercase_count +
        min_uppercase_count +
        min_digit_count +
        min_special_count
    );
  }
  @Input() set passwordProfile(val) {
    this._pwdProfile = val;
    if (this.profileOptions.resetModel) {
      this.profileOptions.resetModel(this._pwdProfile);
    }
    this.submittingForm = false;
  }

  constructor(
    private tr: TranslateService,
    private utils: UtilsService,
    private authUtils: AuthUtilsService,
    private settingsService: SettingsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.profileOptions.formState.isUpdatePwdProfileAuthorized =
      this.authUtils.getDisplayFlagByMultiPermission('update_password_profile');
  }

  submitForm(): void {
    if (!this.profileForm.valid) {
      return;
    }
    const profilePatch = { ...this.passwordProfile, ...this.profileForm.value };
    this.submittingForm = true;
    this.settingsService.patchPwdProfile(profilePatch).subscribe({
      complete: () => {
        this.notificationService.open(
          this.tr.instant('passwordProfile.msg.UPDATE_PROFILE_OK')
        );
        this.passwordProfile = profilePatch;
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.open(
          this.utils.getAlertifyMsg(
            error,
            this.tr.instant('passwordProfile.msg.UPDATE_PROFILE_NG'),
            false
          ),
          GlobalConstant.NOTIFICATION_TYPE.ERROR
        );
        this.submittingForm = false;
      },
    });
  }
}
