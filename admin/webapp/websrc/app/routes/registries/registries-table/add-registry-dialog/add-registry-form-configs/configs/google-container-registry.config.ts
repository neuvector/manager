import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  FilterField,
  IntervalField,
  JsonKeyField,
  NameField,
  PeriodicScanField,
  RegistryField,
  RescanField,
  ScanLayersField,
} from '../constants/constants';
import { cloneDeep } from 'lodash';

const GoogleContainerRegistryField = cloneDeep(RegistryField);
GoogleContainerRegistryField.templateOptions.hint = 'registry.GOOGLE_URL_HINT';
export const GoogleContainerRegistryConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12 col-md-6',
        ...NameField,
      },
      {
        className: 'col-12 col-md-6',
        ...GoogleContainerRegistryField,
      },
      {
        className: 'col-12',
        ...JsonKeyField,
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
