import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  CommentField,
  PersonalAccessTokenCommitterNameField,
  PersonalAccessTokenEmailField,
  PersonalAccessTokenField,
  ProviderField,
  RepositoryBranchNameField,
  RepositoryNameField,
  RepositoryOwnerField,
} from './constants';

export const RemoteRepoFormConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12 col-md-6 mt-2',
        ...ProviderField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...CommentField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...RepositoryOwnerField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...RepositoryNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...RepositoryBranchNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...PersonalAccessTokenField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...PersonalAccessTokenCommitterNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...PersonalAccessTokenEmailField,
      },
    ],
  },
];
