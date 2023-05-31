import { Component, OnInit, Inject } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SignaturesService } from '@services/signatures.service';
import { TranslateService } from '@ngx-translate/core';
import { WafPattern } from '@common/types';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { Signature, Verifier } from '@common/types/signatures/signature';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { updateGridData } from '@common/utils/common.utils';


@Component({
  selector: 'app-add-edit-signature-verifiers-modal',
  templateUrl: './add-edit-signature-verifiers-modal.component.html',
  styleUrls: ['./add-edit-signature-verifiers-modal.component.scss']
})
export class AddEditSignatureVerifiersModalComponent implements OnInit {

  addEditSignatureForm: FormGroup;
  opTypeOptions = GlobalConstant.MODAL_OP;
  submittingUpdate: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<AddEditSignatureVerifiersModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private signaturesService: SignaturesService,
    private translate: TranslateService,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) { }

  ngOnInit(): void {
    if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
      this.addEditSignatureForm = new FormGroup({
        name: new FormControl('', Validators.required),
        comment: new FormControl(''),
        rekor_public_key: new FormControl(''),
        root_cert: new FormControl(''),
        sct_public_key: new FormControl(''),
        is_private: new FormControl(true),
        cfg_type: new FormControl(GlobalConstant.CFG_TYPE.CUSTOMER),
      });
    } else {
      this.addEditSignatureForm = new FormGroup({
        name: new FormControl(this.data.signature.name, Validators.required),
        comment: new FormControl(this.data.signature.comment),
        rekor_public_key: new FormControl(this.data.signature.rekor_public_key),
        root_cert: new FormControl(this.data.signature.root_cert),
        sct_public_key: new FormControl(this.data.signature.sct_public_key),
        is_private: new FormControl(this.data.signatureis_private),
        cfg_type: new FormControl(this.data.cfg_type),
      });
    }
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  updateSigstore = () => {
    this.signaturesService.updateSigstoreData(
      this.addEditSignatureForm.value,
      this.data.opType
    ).subscribe(
      response => {
        this.notificationService.open(
          this.data.opType === GlobalConstant.MODAL_OP.ADD ?
          this.translate.instant("signatures.msg.INSERT_SIGSTORE_OK") :
          this.translate.instant("signatures.msg.UPDATE_SIGSTORE_OK")
        );
        this.dialogRef.close(true);
        updateGridData(
          this.data.sigstores,
          [this.data.opType === GlobalConstant.MODAL_OP.ADD ?
            {
              name: this.addEditSignatureForm.value.name,
              comment: this.addEditSignatureForm.value.comment,
              rekor_public_key: this.addEditSignatureForm.value.rekor_public_key,
              root_cert: this.addEditSignatureForm.value.root_cert,
              sct_public_key: this.addEditSignatureForm.value.sct_public_key,
              cfg_type: GlobalConstant.CFG_TYPE.CUSTOMER,
            } :
            this.addEditSignatureForm.value
          ],
          this.data.gridApi,
          'name',
          this.data.opType === GlobalConstant.MODAL_OP.ADD ? 'add' : 'edit'
        );
      },
      error => {
        if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
          let msg = this.data.opType === GlobalConstant.MODAL_OP.ADD ?
            this.translate.instant("signatures.msg.INSERT_SIGSTORE_NG") :
            this.translate.instant("signatures.msg.UPDATE_SIGSTORE_NG");
          this.notificationService.open(
            this.utils.getAlertifyMsg(error.error, msg, false),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          )
        }
      }
    );
  };

}
