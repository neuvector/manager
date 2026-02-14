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
  standalone: false,
  selector: 'app-add-edit-signature-verifiers-modal',
  templateUrl: './add-edit-signature-verifiers-modal.component.html',
  styleUrls: ['./add-edit-signature-verifiers-modal.component.scss'],
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
  ) {}

  ngOnInit(): void {
    if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
      this.addEditSignatureForm = new FormGroup({
        name: new FormControl('', Validators.required),
        comment: new FormControl(''),
        rekor_public_key: new FormControl(''),
        root_cert: new FormControl('', Validators.required),
        sct_public_key: new FormControl(''),
        attribute: new FormControl(GlobalConstant.SIGSTORE_ATTRIBUTE.PRIVATE),
        cfg_type: new FormControl(GlobalConstant.CFG_TYPE.CUSTOMER),
      });
    } else {
      this.addEditSignatureForm = new FormGroup({
        name: new FormControl(this.data.signature.name, Validators.required),
        comment: new FormControl(this.data.signature.comment),
        rekor_public_key: new FormControl(this.data.signature.rekor_public_key),
        root_cert: new FormControl(
          this.data.signature.root_cert,
          this.data.signature.attribute ===
            GlobalConstant.SIGSTORE_ATTRIBUTE.PRIVATE
            ? Validators.required
            : null
        ),
        sct_public_key: new FormControl(this.data.signature.sct_public_key),
        attribute: new FormControl(this.data.signature.attribute),
        cfg_type: new FormControl(this.data.cfg_type),
      });
    }
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  changeAttribute = () => {
    let attribute = this.addEditSignatureForm.get('attribute')!.value;
    let name = this.addEditSignatureForm.get('name')!.value;
    let comment = this.addEditSignatureForm.get('comment')!.value;
    let cfgType = this.addEditSignatureForm.get('cfg_type')!.value;
    if (attribute == GlobalConstant.SIGSTORE_ATTRIBUTE.PRIVATE) {
      this.addEditSignatureForm
        .get('root_cert')!
        .setValidators([Validators.required]);
    } else {
      this.addEditSignatureForm.get('root_cert')!.clearValidators();
    }
    this.addEditSignatureForm.reset();
    this.addEditSignatureForm.get('attribute')!.setValue(attribute);
    this.addEditSignatureForm.get('name')!.setValue(name);
    this.addEditSignatureForm.get('comment')!.setValue(comment);
    this.addEditSignatureForm.get('cfg_type')!.setValue(cfgType);
  };

  updateSigstore = () => {
    if (
      this.addEditSignatureForm.controls.attribute.value !==
      GlobalConstant.SIGSTORE_ATTRIBUTE.PRIVATE
    ) {
      this.addEditSignatureForm.controls.rekor_public_key.setValue('');
      this.addEditSignatureForm.controls.root_cert.setValue('');
      this.addEditSignatureForm.controls.sct_public_key.setValue('');
    }
    this.signaturesService
      .updateSigstoreData(this.addEditSignatureForm.value, this.data.opType)
      .subscribe(
        response => {
          this.notificationService.open(
            this.data.opType === GlobalConstant.MODAL_OP.ADD
              ? this.translate.instant('signatures.msg.INSERT_SIGSTORE_OK')
              : this.translate.instant('signatures.msg.UPDATE_SIGSTORE_OK')
          );
          this.dialogRef.close(true);
          updateGridData(
            this.data.sigstores,
            [
              this.data.opType === GlobalConstant.MODAL_OP.ADD
                ? {
                    name: this.addEditSignatureForm.value.name,
                    comment: this.addEditSignatureForm.value.comment,
                    attribute: this.addEditSignatureForm.value.attribute,
                    rekor_public_key:
                      this.addEditSignatureForm.value.rekor_public_key,
                    root_cert: this.addEditSignatureForm.value.root_cert,
                    sct_public_key:
                      this.addEditSignatureForm.value.sct_public_key,
                    cfg_type: GlobalConstant.CFG_TYPE.CUSTOMER,
                  }
                : this.addEditSignatureForm.value,
            ],
            this.data.gridApi,
            'name',
            this.data.opType === GlobalConstant.MODAL_OP.ADD ? 'add' : 'edit'
          );
        },
        error => {
          if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
            let msg =
              this.data.opType === GlobalConstant.MODAL_OP.ADD
                ? this.translate.instant('signatures.msg.INSERT_SIGSTORE_NG')
                : this.translate.instant('signatures.msg.UPDATE_SIGSTORE_NG');
            this.notificationService.open(
              this.utils.getAlertifyMsg(error.error, msg, false),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        }
      );
  };
}
