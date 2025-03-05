import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  GithubFilterField,
  IntervalField,
  NameField,
  PasswordField,
  PeriodicScanField,
  RegistryField,
  RescanField,
  ScanLayersField,
  UsernameField,
} from '../constants/constants';
import { cloneDeep } from 'lodash';

const GithubContainerRegistryField = cloneDeep(RegistryField);
GithubContainerRegistryField.templateOptions.hint =
  'registry.GITHUB_CONTAINER_URL_HINT';
const GithubContainerFilterField = cloneDeep(GithubFilterField);
GithubContainerFilterField.templateOptions.hint =
  'registry.GITHUB_CONTAINER_FILTER_HINT';
const GithubContainerPasswordField = cloneDeep(PasswordField);
GithubContainerPasswordField.templateOptions.label = 'ldap.TOKEN';
GithubContainerPasswordField.templateOptions.icon = 'vpn_key';
export const GithubContainerRegistryConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12 col-md-6',
        ...NameField,
      },
      {
        className: 'col-12 col-md-6',
        ...GithubContainerRegistryField,
      },
      {
        className: 'col-12 col-md-6',
        ...UsernameField,
      },
      {
        className: 'col-12 col-md-6',
        ...GithubContainerPasswordField,
      },
      {
        className: 'col-12',
        ...GithubContainerFilterField,
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
        ...PeriodicScanField,
      },
      {
        hideExpression: '!model.periodic_scan',
        className: 'col-12 col-md-6 col-xl-5',
        ...IntervalField,
      },
    ],
  },
];
