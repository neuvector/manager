import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { AddEditSignatureVerifiersModalComponent } from '../add-edit-signature-verifiers-modal/add-edit-signature-verifiers-modal.component';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { switchMap } from 'rxjs/operators';
import { SignaturesService } from '@services/signatures.service';
import { updateGridData } from '@common/utils/common.utils';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-signature-action-buttons',
  templateUrl: './signature-action-buttons.component.html',
  styleUrls: ['./signature-action-buttons.component.scss'],
})
export class SignatureActionButtonsComponent implements ICellRendererAngularComp {
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

  editSignature = data => {
    const addEditDialogRef = this.dialog.open(
      AddEditSignatureVerifiersModalComponent,
      {
        width: '80%',
        data: {
          signature: data,
          opType: GlobalConstant.MODAL_OP.EDIT,
          gridOptions4Signatures:
            this.params.context.componentParent.gridOptions4Signatures,
          index4Signature: this.params.context.componentParent.index4Signature,
          gridApi: this.params.context.componentParent.gridApi4Signatures!,
          sigstores: this.params.context.componentParent.signatures,
        },
      }
    );
  };

  deleteSignature = data => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: this.translate.instant('signatures.msg.REMOVE_CFM'),
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.signaturesService.deleteSigstoreData(data.name);
        })
      )
      .subscribe(
        res => {
          // confirm actions
          updateGridData(
            this.params.context.componentParent.signatures,
            [data],
            this.params.context.componentParent.gridApi4Signatures!,
            'name',
            'delete'
          );
          if (this.params.context.componentParent.signatures.length === 0)
            this.params.context.componentParent.gridApi4Verifiers!.setGridOption(
              'rowData',
              []
            );
          this.params.context.componentParent.selectedSignature = null;
          this.notificationService.open(
            this.translate.instant('signatures.msg.REMOVE_SIGSTORE_OK')
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
                this.translate.instant('signatures.msg.REMOVE_SIGSTORE_NG'),
                false
              ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        }
      );
  };
}
