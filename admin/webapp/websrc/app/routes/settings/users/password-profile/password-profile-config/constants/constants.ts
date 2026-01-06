import { FormlyComponents } from '@common/neuvector-formly/neuvector-formly.module';
import { FormlyFieldConfig } from '@ngx-formly/core';

export const MinLengthField = {
  key: 'min_len',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.passwordFormat.MIN_LEN',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.isUpdatePwdProfileAuthorized',
  },
};

export const MinUppercaseField = {
  key: 'min_uppercase_count',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.passwordFormat.MIN_UPPER',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.isUpdatePwdProfileAuthorized',
  },
};

export const MinLowercaseField = {
  key: 'min_lowercase_count',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.passwordFormat.MIN_LOWER',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.isUpdatePwdProfileAuthorized',
  },
};

export const MinNumericField = {
  key: 'min_digit_count',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.passwordFormat.MIN_DIGIT',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.isUpdatePwdProfileAuthorized',
  },
};

export const MinSpecialField = {
  key: 'min_special_count',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.passwordFormat.MIN_SP_CHAR',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.isUpdatePwdProfileAuthorized',
  },
};

export const MinErrorField = {
  wrappers: [FormlyComponents.READONLY_WRAPPER],
  templateOptions: {
    readOnly: {
      type: 'error',
      template: () => 'passwordProfile.msg.NUM_ERR',
      always: true,
    },
  },
  hideExpression: model =>
    model.min_len >=
    model.min_uppercase_count +
      model.min_lowercase_count +
      model.min_digit_count +
      model.min_special_count,
};

export const FailedLoginToggleField = {
  key: 'enable_block_after_failed_login',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    ariaLabelledBy: 'passwordProfile.loginFailureAllowance.TITLE',
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.isUpdatePwdProfileAuthorized',
  },
};

export const FailedLoginAttemptsField = {
  key: 'block_after_failed_login_count',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.loginFailureAllowance.CNT_ALLOW_FAIL',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!formState.isUpdatePwdProfileAuthorized || !model.enable_block_after_failed_login',
  },
};

export const FailedLoginAccessField = {
  key: 'block_minutes',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.loginFailureAllowance.BLOCK_TIME',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!formState.isUpdatePwdProfileAuthorized || !model.enable_block_after_failed_login',
  },
};

export const ExpiredPasswordToggleField = {
  key: 'enable_password_expiration',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    ariaLabelledBy: 'passwordProfile.passwordExpiring.TITLE',
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.isUpdatePwdProfileAuthorized',
  },
};

export const ExpiredPasswordAgeField = {
  key: 'password_expire_after_days',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.passwordExpiring.PASSWORD_EXPIRED_DAYS',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!formState.isUpdatePwdProfileAuthorized || !model.enable_password_expiration',
  },
};

export const PasswordHistoryToggleField = {
  key: 'enable_password_history',
  type: FormlyComponents.TOGGLE,
  templateOptions: {
    ariaLabelledBy: 'passwordProfile.passwordHistory.TITLE',
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.isUpdatePwdProfileAuthorized',
  },
};

export const PasswordHistoryKeptField = {
  key: 'password_keep_history_count',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.passwordHistory.NUM_PASSWORD_HISTORY',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled':
      '!formState.isUpdatePwdProfileAuthorized || !model.enable_password_history',
  },
};

export const DefaultSessionTimeoutField = {
  key: 'session_timeout',
  wrappers: [FormlyComponents.HINT_WRAPPER],
  type: FormlyComponents.ICON_INPUT,
  templateOptions: {
    hint: 'passwordProfile.globalPolicy.SESSION_TIMEOUT',
    hintClass: 'font-weight-bold text-muted col-md-6 mb-4',
    wrapperClass: 'align-items-center',
    noInputHint: true,
    hideRequiredMarker: true,
    inputWidth: 50,
    type: 'number',
    min: 0,
    required: true,
  },
  expressionProperties: {
    'templateOptions.disabled': '!formState.isUpdatePwdProfileAuthorized',
  },
};
