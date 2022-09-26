import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  AuthenticationTypeField,
  AutoScanField,
  FilterField,
  NameField,
  PasswordField,
  RegistryField,
  RescanField,
  ScanLayersField,
  TokenAuthenticationField,
  UsernameField,
} from '../constants/constants';
import { cloneDeep } from 'lodash';

const OpenShiftRegistryField = cloneDeep(RegistryField);
OpenShiftRegistryField.templateOptions.hint = 'registry.OPENSHIFT_URL_HINT';
export const OpenShiftRegistryConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12 col-md-6',
        ...NameField,
      },
      {
        className: 'col-12 col-md-6',
        ...OpenShiftRegistryField,
      },
      {
        className: 'col-12 mt-3',
        ...AuthenticationTypeField,
      },
      {
        hideExpression: 'model.auth_with_token === true',
        className: 'col-12 col-md-6',
        ...UsernameField,
      },
      {
        hideExpression: 'model.auth_with_token === true',
        className: 'col-12 col-md-6',
        ...PasswordField,
      },
      {
        hideExpression: 'model.auth_with_token === false',
        className: 'col-12',
        ...TokenAuthenticationField,
      },
      {
        className: 'col-12',
        ...FilterField,
      },
    ],
  },
  {
    fieldGroupClassName: 'row align-items-center mt-3',
    fieldGroup: [
      {
        className: 'col-12 col-md-6 col-xl-3',
        ...RescanField,
      },
      {
        className: 'col-12 col-md-6 col-xl-2',
        ...ScanLayersField,
      },
      {
        className: 'col-12 col-md-6 col-xl-2',
        ...AutoScanField,
      },
    ],
  },
];
