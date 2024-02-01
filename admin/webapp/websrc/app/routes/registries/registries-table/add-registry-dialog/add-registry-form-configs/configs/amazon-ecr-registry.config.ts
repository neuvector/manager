import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  AccessKeyField,
  FilterField,
  IdField,
  IntervalField,
  NameField,
  PeriodicScanField,
  RegionField,
  AWSRegistryField,
  RescanField,
  ScanLayersField,
  SecretAccessKeyField,
} from '../constants/constants';
import { cloneDeep } from 'lodash';

const AmazonRegistryField = cloneDeep(AWSRegistryField);
export const AmazonEcrRegistryConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12 col-md-6',
        ...NameField,
      },
      {
        className: 'col-12 col-md-6',
        ...AmazonRegistryField,
      },
      {
        className: 'col-12 col-md-6',
        ...IdField,
      },
      {
        className: 'col-12 col-md-6',
        ...AccessKeyField,
      },
      {
        className: 'col-12 col-md-6',
        ...RegionField,
      },
      {
        className: 'col-12 col-md-6',
        ...SecretAccessKeyField,
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
