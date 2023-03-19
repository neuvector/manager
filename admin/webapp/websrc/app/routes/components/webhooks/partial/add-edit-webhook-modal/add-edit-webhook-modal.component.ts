import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { WebhookService } from '@services/webhook.service';
import { NotificationService } from '@services/notification.service';
import { GlobalConstant } from '@common/constants/global.constant';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { OtherWebhookType, Webhook, WebhookTypes } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-add-edit-webhook-modal',
  templateUrl: './add-edit-webhook-modal.component.html',
  styleUrls: ['./add-edit-webhook-modal.component.scss'],
})
export class AddEditWebhookModalComponent implements OnInit {
  modalOp: any;
  form: FormGroup;
  processing: boolean = false;
  types = WebhookTypes;

  constructor(
    public dialogRef: MatDialogRef<AddEditWebhookModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private webhookService: WebhookService,
    public translate: TranslateService,
    private utils: UtilsService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    dialogRef.disableClose = true;
  }

  ngOnInit(): void {
    this.modalOp = GlobalConstant.MODAL_OP;
    if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
      this.form = new FormGroup({
        name: new FormControl('fed.', [
          Validators.required,
          this.nameValidator(),
          this.fedNameValidator(),
        ]),
        url: new FormControl('', [Validators.required, this.urlValidator()]),
        type: new FormControl(OtherWebhookType, [Validators.required]),
        enable: new FormControl(true),
        cfg_type: new FormControl(GlobalConstant.CFG_TYPE.FED),
      });
    } else {
      this.form = new FormGroup({
        name: new FormControl(this.data.webhook.name, [
          Validators.required,
          this.nameValidator(),
          this.fedNameValidator(),
        ]),
        url: new FormControl(this.data.webhook.url, [
          Validators.required,
          this.urlValidator(),
        ]),
        type: new FormControl(
          this.data.webhook.type ? this.data.webhook.type : OtherWebhookType,
          [Validators.required]
        ),
        enable: new FormControl(this.data.webhook.enable),
        cfg_type: new FormControl(GlobalConstant.CFG_TYPE.FED),
      });
    }
  }

  nameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const pattern = new RegExp(/^[a-zA-Z0-9]+[.:a-zA-Z0-9_-]*[^.]$/);
      if (!value) {
        return null;
      }
      return pattern.test(value) ? null : { invalidObjName: true };
    };
  }

  fedNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isValid = control.value.startsWith('fed.');
      return isValid ? null : { fedName: { value: control.value } };
    };
  }

  urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const pattern = new RegExp(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
      );
      if (!value) {
        return null;
      }
      return pattern.test(value) ? null : { invalidURL: true };
    };
  }

  updateWebhook = () => {
    let webhook: Webhook = cloneDeep(this.form.value);
    webhook.url = webhook.url.trim();
    webhook.type = webhook.type == OtherWebhookType ? '' : webhook.type;
    webhook.cfg_type = GlobalConstant.CFG_TYPE.FED;

    this.processing = true;
    if (this.data.opType == GlobalConstant.MODAL_OP.ADD) {
      this.webhookService.addWebhook(webhook).subscribe({
        next: response => {
          this.notificationService.open(
            this.translate.instant('setting.webhook.SUBMIT_OK')
          );
          this.onCancel(true);
        },
        error: err => {
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              err,
              this.translate.instant('setting.webhook.SUBMIT_FAILED'),
              false
            ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
          this.processing = false;
        },
      });
    } else {
      this.webhookService.updateWebhook(webhook).subscribe({
        next: response => {
          this.notificationService.open(
            this.translate.instant('setting.webhook.SUBMIT_OK')
          );
          this.onCancel(true);
        },
        error: err => {
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              err,
              this.translate.instant('setting.webhook.SUBMIT_FAILED'),
              false
            ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
          this.processing = false;
        },
      });
    }
  };

  onCancel = refresh => {
    this.dialogRef.close(refresh);
  };
}
