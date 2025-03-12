import { FormlyFieldConfig } from '@ngx-formly/core';
import { CommentField, ProviderField, EnabledField } from './constants';
import { AzureDevopsConfiguration } from '@routes/settings/configuration/remote-repository-form/remote-repository-form-config/configs/azure.config';
import { GithubRemoteRepositoryFormConfig } from '@routes/settings/configuration/remote-repository-form/remote-repository-form-config/configs/github.config';

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
        hideExpression: `model.provider !== "azure devops"`,
        className: 'col-12',
        fieldGroup: [...AzureDevopsConfiguration],
      },
      {
        hideExpression: `model.provider !== "github"`,
        className: 'col-12',
        fieldGroup: [...GithubRemoteRepositoryFormConfig],
      },
      {
        className: 'col-12 mt-4',
        ...EnabledField,
      },
    ],
  },
];
