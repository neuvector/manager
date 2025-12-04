import { Component, OnInit } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { FormControl } from '@angular/forms';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { FederatedConfigurationService } from '@services/federated-configuration.service';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-edit-webhook-table-controls',
  templateUrl: './edit-webhook-table-controls.component.html',
  styleUrls: ['./edit-webhook-table-controls.component.scss'],
  
})
export class EditWebhookTableControlsComponent
  extends FieldType<FieldTypeConfig>
  implements OnInit
{
  cache: any;

  constructor(
    private utils: UtilsService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private federatedConfigurationService: FederatedConfigurationService
  ) {
    super();
  }

  get isEditable(): FormControl {
    return <FormControl>this.form.get('isEditable');
  }

  ngOnInit(): void {
    this.cache = {};
  }

  edit(): void {
    this.cache = this.form.value;
    this.toggleEdit();

    //name is not allowed to be edited
    const field = this.field.parent?.fieldGroup?.find(
      item => item.key === 'name'
    );

    if (field?.templateOptions) {
      field.templateOptions.disabled = true;
    }
  }

  toggleEdit(): void {
    if (!this.isEditable.value) {
      this.isEditable.setValue(true);
    } else {
      this.isEditable.setValue(false);
    }
  }

  delete(): void {
    this.federatedConfigurationService
      .deleteWebhook(this.form.value.name)
      .subscribe({
        next: res => {
          const _i = this.field.parent?.key;
          this.field.parent?.parent?.templateOptions?.remove(_i);
        },
        error: err => {
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
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      //enable this.form.value to include the name
      const field = this.field.parent?.fieldGroup?.find(
        item => item.key === 'name'
      );

      if (field?.templateOptions) {
        field.templateOptions.disabled = false;
      }

      let webhook = { ...this.form.value };
      if (this.form.value.type === GlobalConstant.OtherWebhookType) {
        webhook.type = '';
      }
      webhook.url = webhook.url.trim();

      if (Object.keys(this.cache).length > 0) {
        this.federatedConfigurationService.patchWebhook(webhook).subscribe({
          next: res => {
            this.notificationService.open(
              this.translate.instant('setting.SUBMIT_OK')
            );
            this.toggleEdit();
            this.cache = {};
          },
          error: err => {
            this.notificationService.open(
              this.utils.getAlertifyMsg(
                err,
                this.translate.instant('setting.SUBMIT_FAILED'),
                false
              ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
            //disable the name editing
            const field = this.field.parent?.fieldGroup?.find(
              item => item.key === 'name'
            );

            if (field?.templateOptions) {
              field.templateOptions.disabled = true;
            }
          },
        });
      } else {
        this.federatedConfigurationService.addWebhook(webhook).subscribe({
          next: res => {
            this.notificationService.open(
              this.translate.instant('setting.SUBMIT_OK')
            );
            this.toggleEdit();
            this.cache = {};
          },
          error: err => {
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
      }
    }
  }

  cancel(): void {
    if (Object.keys(this.cache).length === 0) {
      const _i = this.field.parent?.key;
      this.field.parent?.parent?.templateOptions?.remove(_i);
    } else {
      this.form.patchValue(this.cache);
      this.cache = {};
    }
  }
}
