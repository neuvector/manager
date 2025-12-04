import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorResponse, Self } from '@common/types';
import { passwordValidator } from '@common/validators';
import { TranslatorService } from '@core/translator/translator.service';
import { NotificationService } from '@services/notification.service';
import { SettingsService } from '@services/settings.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { MapConstant } from '@common/constants/map.constant';


@Component({
  standalone: false,
  selector: 'app-profile-form',
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss'],
  
})
export class ProfileFormComponent implements OnInit {
  @Input() user!: Self;
  @Input() emailHash!: string;
  isEdit: boolean = false;
  profileForm = new FormGroup({
    username: new FormControl(),
    email: new FormControl(null, [Validators.email]),
    role: new FormControl(),
    timeout: new FormControl(null, [Validators.min(30), Validators.max(3600)]),
    locale: new FormControl(),
    passwordForm: new FormGroup(
      {
        currentPassword: new FormControl(null, [Validators.required]),
        newPassword: new FormControl(null, [Validators.required]),
        confirmPassword: new FormControl(null, [Validators.required]),
      },
      { validators: passwordValidator() }
    ),
  });
  errorMessage = '';
  submittingForm: boolean = false;
  get passwordForm(): FormGroup {
    return <FormGroup>this.profileForm.get('passwordForm');
  }
  get isLocalUser(): boolean {
    return this.user.server === '';
  }
  get isRancherSSO(): boolean {
    return this.user.server
      .toLowerCase()
      .includes(MapConstant.AUTH_PROVIDER.RANCHER.toLowerCase());
  }
  get gravatarEnabled() {
    return GlobalVariable.gravatar;
  }

  constructor(
    private settingsService: SettingsService,
    private tr: TranslatorService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  getLanguages(): { code: string; text: string }[] {
    return this.tr.getAvailableLanguages();
  }

  refreshForm(): void {
    Object.keys(this.user).forEach((key: string) => {
      if (this.profileForm.controls[key]) {
        this.profileForm.controls[key].setValue(
          this.user ? this.user[key] : null
        );
      }
    });
    this.passwordForm.reset();
  }

  refreshUser(): void {
    Object.keys(this.profileForm.controls).forEach((key: string) => {
      if (key in this.user) {
        if (typeof this.user[key] === 'number') {
          this.user[key] = +this.profileForm.controls[key].value;
        } else {
          this.user[key] = this.profileForm.controls[key].value;
        }
      }
    });
    if (!this.isPasswordPanelEmpty()) {
      this.user['password'] =
        this.passwordForm.controls['currentPassword'].value;
      this.user['new_password'] =
        this.passwordForm.controls['newPassword'].value;
    }
  }

  isPasswordPanelEmpty(): boolean {
    return !Object.keys(this.passwordForm.controls).filter(
      key => !!this.passwordForm.controls[key].value
    ).length;
  }

  formValid(): boolean {
    let basicValid = Object.keys(this.profileForm.controls).every(
      key =>
        key === 'passwordForm' ||
        this.profileForm.controls[key].valid ||
        this.profileForm.controls[key].disabled
    );
    return (
      this.profileForm.valid || (basicValid && this.isPasswordPanelEmpty())
    );
  }

  ngOnInit(): void {
    this.refreshForm();
    this.profileForm.disable();
  }

  updateEdit(): void {
    if (this.isEdit) {
      this.profileForm.controls['email'].enable();
      this.profileForm.controls['timeout'].enable();
      this.profileForm.controls['locale'].enable();
      this.profileForm.controls['passwordForm'].enable();
    } else {
      this.profileForm.disable();
      this.refreshForm();
    }
  }

  toggleEdit(): void {
    this.isEdit = !this.isEdit;
    this.updateEdit();
  }

  cancelEdit(): void {
    this.isEdit = false;
    this.updateEdit();
  }

  submitForm(): void {
    this.refreshUser();
    this.submittingForm = true;
    this.settingsService
      .patchSelf(this.user)
      .pipe(
        finalize(() => {
          this.submittingForm = false;
          this.toggleEdit();
        })
      )
      .subscribe({
        complete: () => {
          this.notificationService.open(
            this.tr.translate.instant('profile.SUBMIT_OK')
          );
          this.router.navigate(['logout']);
        },
        error: ({ error }: { error: ErrorResponse }) => {
          if (error.error && error.message) {
            this.errorMessage = `${error.error}: ${error.message}`;
          } else {
            this.errorMessage = 'An error occurred. Please try again.';
          }
          console.log(this.errorMessage);
          this.notificationService.open(
            this.tr.translate.instant('profile.SUBMIT_FAILED'),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        },
      });
  }
}
