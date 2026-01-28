import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { GroupsService } from '@services/groups.service';
import { NotificationService } from '@services/notification.service';
import { updateGridData } from '@common/utils/common.utils';

@Component({
  standalone: false,
  selector: 'app-custom-check-action-button',
  templateUrl: './custom-check-action-button.component.html',
  styleUrls: ['./custom-check-action-button.component.scss'],
})
export class CustomCheckActionButtonComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private groupsService: GroupsService,
    private notificationService: NotificationService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  removeScript = data => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: `${this.translate.instant(
          'group.script.msg.REMOVE_WARNING'
        )} - ${data.name}`,
        isSync: true,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let payload = {
          group: this.params.context.componentParent.groupName,
          config: {
            delete: {
              scripts: [data],
            },
          },
        };
        this.groupsService.updateCustomCheckData(payload).subscribe(
          response => {
            this.notificationService.open(
              this.translate.instant('group.script.msg.SCRIPT_OK')
            );
            this.params.context.componentParent.refresh();
            updateGridData(
              this.params.context.componentParent.customCheckScripts,
              [data],
              this.params.context.componentParent.gridApi!,
              'name',
              'delete'
            );
            this.params.context.componentParent.initializeVM();
          },
          error => {
            this.notificationService.openError(
              error.error,
              this.translate.instant('group.script.msg.SCRIPT_NG')
            );
          }
        );
      }
    });
  };
}
