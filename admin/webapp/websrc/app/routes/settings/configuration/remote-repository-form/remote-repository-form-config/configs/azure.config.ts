import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  AzureBranchNameField,
  AzureOrganizationNameField,
  AzurePersonalAccessTokenField,
  AzureProjectNameField,
  AzureRepositoryNameField,
} from '../constants';

export const AzureDevopsConfiguration: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12 col-md-6 mt-2',
        ...AzureOrganizationNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...AzureProjectNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...AzureRepositoryNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...AzureBranchNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...AzurePersonalAccessTokenField,
      },
    ],
  },
];
