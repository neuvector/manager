import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  FedRegistryHideExpr,
  FilterField,
  Registries,
} from './constants/constants';
import { AmazonEcrRegistryConfig } from './configs/amazon-ecr-registry.config';
import { AzureRegistryConfig } from './configs/azure-container-registry.config';
import { DockerRegistryConfig } from './configs/docker-registry.config';
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
        className: 'col-12 col-md-9',
        key: 'registry_type',
        type: FormlyComponents.SELECT,
        defaultValue: Registries.DOCKER_REGISTRY,
        templateOptions: {
          change: field => {
            field.options?.parentForm?.form.markAsPristine();
            field.options?.parentForm?.form.markAsUntouched();
            field.options?.parentForm?.form.updateValueAndValidity();
          },
          label: 'registry.REGISTRY_TYPE',
          items: Object.keys(Registries)
            .map(key => {
              return { value: Registries[key], viewValue: Registries[key] };
            })
            .sort((a, b) =>
              a.value > b.value ? 1 : b.value > a.value ? -1 : 0
            ),
        },
        expressionProperties: {
          'templateOptions.disabled': 'model.isEdit',
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
          'templateOptions.disabled': 'model.isEdit || model.isRemote'
        },
      },
    ],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.AMAZON_ECR_REGISTRY}"`,
    fieldGroup: [...AmazonEcrRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.AZURE_CONTAINER_REGISTRY}"`,
    fieldGroup: [...AzureRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.DOCKER_REGISTRY}"`,
    fieldGroup: [...DockerRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.GITLAB}"`,
    fieldGroup: [...GitlabConfig],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.GOOGLE_CONTAINER_REGISTRY}"`,
    fieldGroup: [...GoogleContainerRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.IBM_CLOUD_CONTAINER_REGISTRY}"`,
    fieldGroup: [...IBMCloudContainerRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.JFROG_ARTIFACTORY}"`,
    fieldGroup: [...JFROgArtifactoryConfig],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.OPENSHIFT_REGISTRY}"`,
    fieldGroup: [...OpenShiftRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.REDHAT_PUBLIC_REGISTRY}"`,
    fieldGroup: [...RedHatRegistryConfig],
  },
  {
    hideExpression: `model.registry_type !== "${Registries.SONATYPE_NEXUS}"`,
    fieldGroup: [...SonatypeNexusConfig],
  },
];

export const TestRegistryFieldConfig: FormlyFieldConfig[] = [
  {
    fieldGroupClassName: 'row',
    fieldGroup: [
      {
        className: 'col-12',
        ...FilterField,
      },
    ],
  },
];
