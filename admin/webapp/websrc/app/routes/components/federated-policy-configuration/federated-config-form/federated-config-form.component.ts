import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
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
  standalone: false,
  selector: 'app-federated-config-form',
  templateUrl: './federated-config-form.component.html',
  styleUrls: ['./federated-config-form.component.scss'],
})
export class FederatedConfigFormComponent
  implements OnInit, ComponentCanDeactivate
{
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
    this._config.webhooks.forEach(e => {
      e.isEditable = e.isEditable ? e.isEditable : false;
      e.type = e.type || GlobalConstant.OtherWebhookType;
    });
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
    this.isFedOpAllowed =
      this.authUtilsService.getDisplayFlag('write_config') &&
      this.authUtilsService.getDisplayFlag('multi_cluster_w');
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
}
