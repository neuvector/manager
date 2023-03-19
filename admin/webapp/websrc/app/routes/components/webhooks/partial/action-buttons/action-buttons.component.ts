import { Component, OnInit, SecurityContext } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { AddEditWebhookModalComponent } from '@components/webhooks/partial/add-edit-webhook-modal/add-edit-webhook-modal.component';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NotificationService } from '@services/notification.service';
import { switchMap } from 'rxjs/operators';
import { WebhookService } from '@services/webhook.service';

@Component({
  selector: 'app-action-buttons',
  templateUrl: './action-buttons.component.html',
  styleUrls: ['./action-buttons.component.scss'],
})
export class ActionButtonsComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor(
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private webhookService: WebhookService,
    private translate: TranslateService,
    private notificationService: NotificationService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  editWebhook(event, webhook) {
    const dialogRef = this.dialog.open(AddEditWebhookModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.EDIT,
        webhook: webhook,
      },
    });
    dialogRef.afterClosed().subscribe(refresh => {
      if (refresh) {
        setTimeout(() => {
          this.params.context.componentParent.refresh();
        });
      }
    });
  }

  deleteWebhook(event, webhook) {
    let name = this.sanitizer.sanitize(SecurityContext.HTML, webhook.name);
    let message = this.translate.instant('setting.webhook.DELETE_CONFIRM', {
      name: name,
    });

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: message,
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.webhookService.deleteWebhook(webhook.name);
        })
      )
      .subscribe(
        res => {
          this.notificationService.open(
            this.translate.instant('setting.webhook.DELETE_SUCCEED')
          );
          setTimeout(() => {
            this.params.context.componentParent.refresh();
          }, 1000);
          dialogRef.close();
          dialogRef.componentInstance.loading = false;
        },
        error => {
          this.notificationService.openError(
            error,
            this.translate.instant('setting.webhook.DELETE_FAILED')
          );
          dialogRef.componentInstance.loading = false;
        }
      );
  }
}
