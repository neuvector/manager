import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { AddEditVerifiersModalComponent } from '../add-edit-verifiers-modal/add-edit-verifiers-modal.component';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { switchMap } from 'rxjs/operators';
import { SignaturesService } from '@services/signatures.service';
import { updateGridData } from '@common/utils/common.utils';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-verifier-action-buttons',
  templateUrl: './verifier-action-buttons.component.html',
  styleUrls: ['./verifier-action-buttons.component.scss'],
})
export class VerifierActionButtonsComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private signaturesService: SignaturesService,
    private utils: UtilsService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  deleteVerifier = data => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: this.translate.instant('signatures.msg.REMOVE_CFM'),
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.signaturesService.deleteVerifierData(
            this.params.context.componentParent.selectedSignature.name,
            data.name
          );
        })
      )
      .subscribe(
        res => {
          // confirm actions
          updateGridData(
            this.params.context.componentParent.verifiers,
            [data],
            this.params.context.componentParent.gridOptions4Verifiers.api!,
            'name',
            'delete'
          );
          this.notificationService.open(
            this.translate.instant('signatures.msg.REMOVE_VERIFIER_OK')
          );
          // close dialog
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
        },
        error => {
          if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
            this.notificationService.open(
              this.utils.getAlertifyMsg(
                error.error,
                this.translate.instant('signatures.msg.REMOVE_VERIFIER_NG'),
                false
              ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        }
      );
  };

  editVerifier = data => {
    const addEditDialogRef = this.dialog.open(AddEditVerifiersModalComponent, {
      width: '80%',
      data: {
        verifier: data,
        opType: GlobalConstant.MODAL_OP.EDIT,
        gridOptions4Verifiers:
          this.params.context.componentParent.gridOptions4Verifiers,
        index4Verifier: this.params.context.componentParent.index4Verifier,
        gridApi: this.params.context.componentParent.gridOptions4Verifiers.api!,
        verifiers: this.params.context.componentParent.verifiers,
        rootOfTrustName:
          this.params.context.componentParent.selectedSignature.name,
        attribute:
          this.params.context.componentParent.selectedSignature.attribute,
      },
    });
  };
}
