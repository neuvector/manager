import { FormlyComponents } from '@common/neuvector-formly/neuvector-formly.module';
import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  DefaultSessionTimeoutField,
  ExpiredPasswordAgeField,
  ExpiredPasswordToggleField,
  FailedLoginAccessField,
  FailedLoginAttemptsField,
  FailedLoginToggleField,
  MinErrorField,
  MinLengthField,
  MinLowercaseField,
  MinNumericField,
  MinSpecialField,
  MinUppercaseField,
  PasswordHistoryKeptField,
  PasswordHistoryToggleField,
} from './constants/constants';

export const PwdProfileFormConfig: FormlyFieldConfig[] = [
  {
    wrappers: [FormlyComponents.SECTION_WRAPPER],
    fieldGroup: [
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-6',
            ...MinLengthField,
          },
        ],
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-6',
            ...MinUppercaseField,
          },
          {
            className: 'col-md-6',
            ...MinLowercaseField,
          },
        ],
      },
      {
        fieldGroupClassName: 'row',
        fieldGroup: [
          {
            className: 'col-md-6',
            ...MinNumericField,
          },
          {
            className: 'col-md-6',
            ...MinSpecialField,
          },
        ],
      },
      {
        className: 'row',
        ...MinErrorField,
      },
    ],
    templateOptions: {
      label: 'passwordProfile.passwordFormat.TITLE',
      divider: true,
    },
  },
  {
    wrappers: [FormlyComponents.SECTION_WRAPPER],
    fieldGroup: [FailedLoginToggleField],
    templateOptions: {
      label: 'passwordProfile.loginFailureAllowance.TITLE',
      appendTo: true,
      inline: true,
    },
  },
  {
    wrappers: [FormlyComponents.SECTION_WRAPPER],
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-md-6',
        ...FailedLoginAttemptsField,
      },
      {
        className: 'col-md-6',
        ...FailedLoginAccessField,
      },
    ],
    templateOptions: { append: true, divider: true },
  },
  {
    wrappers: [FormlyComponents.SECTION_WRAPPER],
    fieldGroup: [ExpiredPasswordToggleField],
    templateOptions: {
      label: 'passwordProfile.passwordExpiring.TITLE',
      appendTo: true,
      inline: true,
    },
  },
  {
    wrappers: [FormlyComponents.SECTION_WRAPPER],
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-md-6',
        ...ExpiredPasswordAgeField,
      },
    ],
    templateOptions: { append: true, divider: true },
  },
  {
    wrappers: [FormlyComponents.SECTION_WRAPPER],
    fieldGroup: [PasswordHistoryToggleField],
    templateOptions: {
      label: 'passwordProfile.passwordHistory.TITLE',
      appendTo: true,
      inline: true,
    },
  },
  {
    wrappers: [FormlyComponents.SECTION_WRAPPER],
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-md-6',
        ...PasswordHistoryKeptField,
      },
    ],
    templateOptions: { append: true, divider: true },
  },
  {
    wrappers: [FormlyComponents.SECTION_WRAPPER],
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-md-6',
        ...DefaultSessionTimeoutField,
      },
    ],
    templateOptions: { label: 'passwordProfile.globalPolicy.TITLE' },
  },
];
