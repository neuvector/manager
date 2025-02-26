import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  FedRegistryHideExpr,
  FilterField,
  TestSettingsFilterField,
} from './constants/constants';
import { AmazonEcrRegistryConfig } from './configs/amazon-ecr-registry.config';
import { AzureRegistryConfig } from './configs/azure-container-registry.config';
import { DockerRegistryConfig } from './configs/docker-registry.config';
import { HarborRegistryConfig } from './configs/harbor-registry.config';
import { GithubContainerRegistryConfig } from './configs/github-container-registry.config';
import { GitlabConfig } from './configs/gitlab.config';
import { RedHatRegistryConfig } from './configs/red-hat-public-registry.config';
import { SonatypeNexusConfig } from './configs/sonatype-nexus.config';
import { GoogleContainerRegistryConfig } from './configs/google-container-registry.config';
import { IBMCloudContainerRegistryConfig } from './configs/ibm-cloud-container-registry.config';
import { JFROgArtifactoryConfig } from './configs/jfrog-artifactory.config';
import { FormlyComponents } from '@common/neuvector-formly/neuvector-formly.module';
import { OpenShiftRegistryConfig } from './configs/openshift-registry.config';

export const AddRegistryFieldConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12 col-md-6',
        key: 'registry_type',
        type: FormlyComponents.SELECT,
        templateOptions: {
          change: field => {
            field.options?.parentForm?.form.markAsPristine();
            field.options?.parentForm?.form.markAsUntouched();
            field.options?.parentForm?.form.updateValueAndValidity();
          },
          label: 'registry.REGISTRY_TYPE',
        },
        expressionProperties: {
          'templateOptions.disabled': 'model.isEdit',
          'templateOptions.items': 'model.registryTypes',
        },
        hooks: {
          onInit: field => {
            field?.formControl?.setValue(
              field.model.registry_type || field.model.defaultRegistryType
            );
          },
        },
      },
      {
        className: 'col-12 col-md-3 mt-4',
        key: 'use_proxy',
        defaultValue: true,
        type: FormlyComponents.TOGGLE,
        templateOptions: {
          label: 'registry.USE_PROXY',
        },
        hooks: {
          onInit(field) {
            const control = field?.formControl;
            if (!field?.options?.formState.isProxyEnabled) {
              control?.setValue(false);
              control?.disable();
            }
          },
        },
      },
      {
        className: 'col-12 col-md-3 mt-4',
        key: 'isFed',
        defaultValue: false,
        type: FormlyComponents.TOGGLE,
        templateOptions: {
          label: 'registry.FOR_FED',
        },
        hideExpression: FedRegistryHideExpr,
        expressionProperties: {
          'templateOptions.disabled': 'model.isEdit || model.isRemote',
        },
      },
    ],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[0].value`,
    fieldGroup: [...AmazonEcrRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[1].value`,
    fieldGroup: [...AzureRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[2].value`,
    fieldGroup: [...DockerRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[3].value`,
    fieldGroup: [...GithubContainerRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[4].value`,
    fieldGroup: [...GitlabConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[5].value`,
    fieldGroup: [...GoogleContainerRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[6].value`,
    fieldGroup: [...HarborRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[7].value`,
    fieldGroup: [...IBMCloudContainerRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[8].value`,
    fieldGroup: [...JFROgArtifactoryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[9].value`,
    fieldGroup: [...OpenShiftRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[10].value`,
    fieldGroup: [...RedHatRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== model.registryTypes[11].value`,
    fieldGroup: [...SonatypeNexusConfig],
  },
];

export const TestRegistryFieldConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12',
        ...TestSettingsFilterField,
      },
    ],
  },
];
