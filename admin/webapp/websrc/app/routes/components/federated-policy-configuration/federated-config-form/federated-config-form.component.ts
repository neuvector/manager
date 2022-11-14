import {Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output} from '@angular/core';
import { OtherWebhookType } from './types/constants';
import { FormGroup } from '@angular/forms';
import { Webhook, FederatedConfiguration } from '@common/types';
import { cloneDeep } from 'lodash';
import { UtilsService } from "@common/utils/app.utils";
import { TranslateService } from "@ngx-translate/core";
import { NotificationService } from "@services/notification.service";

import { FederatedConfigFormConfig } from "@components/federated-policy-configuration/federated-config-form/types";
import { ComponentCanDeactivate } from "@common/guards/pending-changes.guard";
import { Observable } from "rxjs";
import { FederatedConfigurationService } from "@services/federated-configuration.service";

@Component({
  selector: 'app-federated-config-form',
  templateUrl: './federated-config-form.component.html',
  styleUrls: ['./federated-config-form.component.scss']
})
export class FederatedConfigFormComponent implements OnInit,ComponentCanDeactivate {

  @Output() refreshConfig = new EventEmitter();
  fedConfigForm = new FormGroup({});
  fedConfigFields = cloneDeep(FederatedConfigFormConfig);

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
      e.type = e.type || OtherWebhookType;
    });
    this.submittingForm = false;
  }

  submittingForm = false;

  constructor(
    private utils: UtilsService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private federatedConfigurationService: FederatedConfigurationService
  ) { }

  ngOnInit(): void {

  }

  @HostListener('window:beforeunload')
  canDeactivate(): boolean | Observable<boolean> {
    return this.fedConfigForm?.dirty
      ? confirm(this.translate.instant('setting.webhook.LEAVE_PAGE'))
      : true;
  }

  submitForm(): void {

    if( !this.fedConfigForm.valid) {
      return;
    }

    let form: Webhook[] = this.fedConfigForm.getRawValue().webhooks.map(({ isEditable, ...webhook }) => {
      if (webhook.type === OtherWebhookType) {
        webhook.type = '';
      }
      webhook.url = webhook.url.trim();
      return webhook;
    });

    let toDelete: Webhook[] = [];
    let toAdd: Webhook[] = [];

    //check name duplication
    const nameSet = new Set(form.map(v=>v.name));
    if(nameSet.size < form.length){
      this.notificationService.open(
        this.utils.getAlertifyMsg(
          this.translate.instant('setting.webhook.NAME_DUPLICATED'),
          this.translate.instant('setting.webhook.NAME_NG'),
          false)
      );
      return;
    }

    this.submittingForm = true;

    //get deleted webhook items
    this._modelData.webhooks.forEach(element => {
      let existed: boolean = false;
      form.forEach(e => {
        if(e.name === element.name){
          existed = true;
        }
      });

      if(!existed){
        toDelete.push(element);
      }
    });

    //get newly added webhook items
    form.forEach(element => {
      let isNew = true;
      this._modelData.webhooks.forEach(e =>{
        if(e.name === element.name){
          isNew = false;
        }
      });
      if(isNew){
        toAdd.push(element);
      }
    });

    //submit deleted webhook items
    let hasError = false;
    toDelete.forEach(item =>{
      this.federatedConfigurationService.deleteWebhook(item.name).subscribe(
        {
          error: err => {
            hasError = true;
            this.notificationService.open(
              this.utils.getAlertifyMsg(
                err,
                this.translate.instant('setting.SUBMIT_FAILED'),
                false)
            );
          }
        }
      );
    });

    //submit newly added webhook items
    toAdd.forEach(item =>{
      this.federatedConfigurationService.addWebhook(item).subscribe({
        error: err => {
          hasError = true;
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              err,
              this.translate.instant('setting.SUBMIT_FAILED'),
              false)
          );
        }
      });

    });

    setTimeout(() =>{
      if(!hasError){
        this.notificationService.open(
          this.translate.instant('setting.SUBMIT_OK')
        );
      }
      this.refreshConfig.emit();
    },2000);

    this.submittingForm = false;

  }

}
