import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { OtherWebhookType } from './types/constants';
import { FormGroup } from '@angular/forms';
import { Webhook, FederatedConfiguration } from '@common/types';
import { cloneDeep } from 'lodash';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { GlobalConstant } from '@common/constants/global.constant';

import { FederatedConfigFormConfig } from '@components/federated-policy-configuration/federated-config-form/types';
import { ComponentCanDeactivate } from '@common/guards/pending-changes.guard';
import { Observable } from 'rxjs';
import { FederatedConfigurationService } from '@services/federated-configuration.service';
import { FormlyFormOptions } from '@ngx-formly/core';
import { AuthUtilsService } from '@common/utils/auth.utils';

@Component({
  selector: 'app-federated-config-form',
  templateUrl: './federated-config-form.component.html',
  styleUrls: ['./federated-config-form.component.scss'],
})
export class FederatedConfigFormComponent
  implements OnInit, ComponentCanDeactivate {
  isFedOpAllowed = false;
  @Output() refreshConfig = new EventEmitter();
  fedConfigForm = new FormGroup({});
  fedConfigFields = cloneDeep(FederatedConfigFormConfig);
  fedConfigOptions: FormlyFormOptions = {
    formState: {
      permissions: {},
    },
  };

  private _config!: FederatedConfiguration;
  private _modelData!: FederatedConfiguration;

  get config(): FederatedConfiguration {
    return this._config;
  }
  @Input() set config(val) {
    this._modelData = cloneDeep(val);
    this._config = val;
    this.submittingForm = false;
  }

  submittingForm = false;

  constructor(
    private utils: UtilsService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private federatedConfigurationService: FederatedConfigurationService,
    private authUtilsService: AuthUtilsService
  ) {}

  ngOnInit(): void {
    this.isFedOpAllowed = this.authUtilsService.getDisplayFlag(
      'multi_cluster_w'
    );
    this.fedConfigOptions.formState.permissions = {
      isWebhookAuthorized: this.isFedOpAllowed,
    };
  }

  @HostListener('window:beforeunload')
  canDeactivate(): boolean | Observable<boolean> {
    return this.fedConfigForm?.dirty
      ? confirm(this.translate.instant('setting.webhook.LEAVE_PAGE'))
      : true;
  }

  submitForm(): void {
    this.submittingForm = true;

    if (!this.fedConfigForm.valid) {
      this.submittingForm = false;
      return;
    }

    let form: Webhook[] = this.fedConfigForm
      .getRawValue()
      .webhooks.map(({ isEditable, ...webhook }) => {
        if (webhook.type === OtherWebhookType) {
          webhook.type = '';
        }
        webhook.url = webhook.url.trim();
        return webhook;
      });

    let toDelete: Webhook[] = [];
    let toAdd: Webhook[] = [];

    //check name duplication
    const nameSet = new Set(form.map(v => v.name));
    if (nameSet.size < form.length) {
      this.notificationService.open(
        this.utils.getAlertifyMsg(
          this.translate.instant('setting.webhook.NAME_DUPLICATED'),
          this.translate.instant('setting.webhook.NAME_NG'),
          false
        ),
        GlobalConstant.NOTIFICATION_TYPE.ERROR
      );
      return;
    }

    this.submittingForm = true;

    //get deleted webhook items
    this._modelData.webhooks.forEach(element => {
      let existed: boolean = false;
      form.forEach(e => {
        if (e.name === element.name) {
          existed = true;
        }
      });

      if (!existed) {
        toDelete.push(element);
      }
    });

    //get newly added webhook items
    form.forEach(element => {
      let isNew = true;
      this._modelData.webhooks.forEach(e => {
        if (e.name === element.name) {
          isNew = false;
        }
      });
      if (isNew) {
        toAdd.push(element);
      }
    });

    //submit deleted webhook items
    let hasError = false;
    toDelete.forEach(item => {
      this.federatedConfigurationService.deleteWebhook(item.name).subscribe({
        error: err => {
          hasError = true;
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              err,
              this.translate.instant('setting.SUBMIT_FAILED'),
              false
            ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        },
      });
    });

    //submit newly added webhook items
    toAdd.forEach(item => {
      this.federatedConfigurationService.addWebhook(item).subscribe({
        error: err => {
          hasError = true;
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              err,
              this.translate.instant('setting.SUBMIT_FAILED'),
              false
            ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        },
      });
    });

    setTimeout(() => {
      if (!hasError) {
        this.notificationService.open(
          this.translate.instant('setting.SUBMIT_OK')
        );
        this.refreshConfig.emit();
      }
    }, 2000);

    this.submittingForm = false;
  }
}
