import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { FileAccessRulesService } from '@services/file-access-rules.service';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { switchMap } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { updateGridData } from '@common/utils/common.utils';

@Component({
  standalone: false,
  selector: 'app-operation-cell',
  templateUrl: './operation-cell.component.html',
  styleUrls: ['./operation-cell.component.scss'],
})
export class OperationCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private fileAccessRulesService: FileAccessRulesService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  deletePredefinedRule(predefinedRule) {
    let message = `${this.translate.instant('group.file.REMOVE_CONFIRM')} ${
      predefinedRule.filter
    }`;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: message,
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.fileAccessRulesService.updateFileAccessRuleList(
            GlobalConstant.CRUD.D,
            predefinedRule,
            this.params.context.componentParent.data.groupName,
            GlobalConstant.SCOPE.LOCAL,
            true
          );
        })
      )
      .subscribe(
        res => {
          // confirm actions
          this.notificationService.open(
            this.translate.instant('group.file.REMOVE_OK')
          );
          updateGridData(
            this.params.context.componentParent.predefinedFileAccessRules,
            [predefinedRule],
            this.params.context.componentParent.gridApi!,
            'filter',
            'delete'
          );
          // close dialog
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
        },
        error => {
          console.log(error);
          this.notificationService.openError(
            error.error,
            this.translate.instant('group.file.REMOVE_NG')
          );
          dialogRef.componentInstance.loading = false;
        }
      );
  }
}
