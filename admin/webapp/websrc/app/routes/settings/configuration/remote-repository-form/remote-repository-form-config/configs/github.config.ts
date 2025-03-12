import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  GithubBranchNameField,
  GithubOwnerField,
  GithubPersonalAccessTokenCommitterNameField,
  GithubPersonalAccessTokenEmailField,
  GithubPersonalAccessTokenField,
  GithubRepositoryNameField,
} from '../constants';

export const GithubRemoteRepositoryFormConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12 col-md-6 mt-2',
        ...GithubOwnerField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...GithubRepositoryNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...GithubBranchNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...GithubPersonalAccessTokenField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...GithubPersonalAccessTokenCommitterNameField,
      },
      {
        className: 'col-12 col-md-6 mt-2',
        ...GithubPersonalAccessTokenEmailField,
      },
    ],
  },
];
