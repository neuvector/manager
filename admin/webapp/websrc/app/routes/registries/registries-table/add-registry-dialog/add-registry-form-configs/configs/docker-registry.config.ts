import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  FilterField,
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

const DockerRegistryField = cloneDeep(RegistryField);
DockerRegistryField.templateOptions.hint = 'registry.DOCKER_URL_HINT';
export const DockerRegistryConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12 col-md-6',
        ...NameField,
      },
      {
        className: 'col-12 col-md-6',
        ...DockerRegistryField,
      },
      {
        className: 'col-12 col-md-6',
        ...UsernameField,
      },
      {
        className: 'col-12 col-md-6',
        ...PasswordField,
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
