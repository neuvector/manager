import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PublicPasswordProfile } from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '@services/settings.service';

@Component({
  standalone: false,
  selector: 'app-password-panel',
  templateUrl: './password-panel.component.html',
  styleUrls: ['./password-panel.component.scss'],
})
export class PasswordPanelComponent implements OnInit {
  @Input() passwordForm!: FormGroup;
  @Input() isReset = false;
  @Input() resetError!: string;
  @Input() set resetProfile(profile: PublicPasswordProfile) {
    if (profile) {
      this.pwdProfile = profile;
      this.checkPassword(this.passwordForm.get('newPassword')?.value || '');
      this.getReqTxt(this.pwdProfile);
    }
  }
  pwdProfile!: PublicPasswordProfile;
  isCharReqValid!: {
    isReachingMinLen: boolean;
    isReachingMinUpper: boolean;
    isReachingMinLower: boolean;
    isReachingMinDigit: boolean;
    isReachingMinSpChar: boolean;
  };
  reqText!: {
    min_len: string;
    min_uppercase_count: string;
    min_lowercase_count: string;
    min_digit_count: string;
    min_special_count: string;
  };
  isPasswordValid = false;
  isVisible = { currentPassword: false, newPassword: false };

  constructor(
    private tr: TranslateService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    const passwordField = this.passwordForm.get('newPassword');
    if (!this.isReset) {
      this.settingsService.getPublicPwdProfile().subscribe(res => {
        this.pwdProfile = res;
        this.checkPassword(passwordField?.value || '');
        this.getReqTxt(this.pwdProfile);
      });
    }
    passwordField?.valueChanges.subscribe(password => {
      this.checkPassword(password);
    });
  }

  getReqTxt(profile: PublicPasswordProfile) {
    this.reqText = {
      min_len: this.tr.instant('user.passwordRequirement.MIN_LENGTH', {
        minLength: profile.min_len,
      }),
      min_uppercase_count: this.tr.instant(
        'user.passwordRequirement.MIN_UPPER',
        { minUpper: profile.min_uppercase_count }
      ),
      min_lowercase_count: this.tr.instant(
        'user.passwordRequirement.MIN_LOWER',
        { minLower: profile.min_lowercase_count }
      ),
      min_digit_count: this.tr.instant('user.passwordRequirement.MIN_DIGIT', {
        minDigit: profile.min_digit_count,
      }),
      min_special_count: this.tr.instant(
        'user.passwordRequirement.MIN_SP_CHAR',
        { minSpChar: profile.min_special_count }
      ),
    };
  }

  checkPassword(password: string): void {
    if (this.pwdProfile) {
      this.isCharReqValid = this.checkCharReq(password || '', this.pwdProfile);
      this.isPasswordValid = Object.values(this.isCharReqValid).every(
        charReq => charReq
      );
      if (!this.isPasswordValid) {
        this.passwordForm.get('newPassword')?.setErrors({
          charReqInvalid: true,
        });
      }
    }
  }

  checkCharReq(password: string, profile: PublicPasswordProfile) {
    const PATTERNS = {
      UPPER: new RegExp(/[A-Z]/),
      LOWER: new RegExp(/[a-z]/),
      DIGIT: new RegExp(/[0-9]/),
      SP_CHAR: new RegExp(
        /[\!|\"|\#|\$|\%|\&|\'|\(|\)|\*|\+|\,|\-|\.|\/|\:|\;|\<|\=|\>|\?|\@|\[|\\|\]|\^|\_|\`|\{|\||\}|\~]/
      ),
    };
    let count = {
      upper: 0,
      lower: 0,
      digit: 0,
      spChar: 0,
    };

    if (password && password.length > 0) {
      password.split('').forEach(ch => {
        if (PATTERNS.UPPER.test(ch)) count.upper++;
        if (PATTERNS.LOWER.test(ch)) count.lower++;
        if (PATTERNS.DIGIT.test(ch)) count.digit++;
        if (PATTERNS.SP_CHAR.test(ch)) count.spChar++;
      });
    }

    return {
      isReachingMinLen: password.length >= profile.min_len,
      isReachingMinUpper: count.upper >= profile.min_uppercase_count,
      isReachingMinLower: count.lower >= profile.min_lowercase_count,
      isReachingMinDigit: count.digit >= profile.min_digit_count,
      isReachingMinSpChar: count.spChar >= profile.min_special_count,
    };
  }
}
