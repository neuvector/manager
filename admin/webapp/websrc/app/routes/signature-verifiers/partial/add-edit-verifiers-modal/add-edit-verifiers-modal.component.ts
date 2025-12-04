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
import { Verifier } from '@common/types/signatures/signature';
import { updateGridData } from '@common/utils/common.utils';


@Component({
  standalone: false,
  selector: 'app-add-edit-verifiers-modal',
  templateUrl: './add-edit-verifiers-modal.component.html',
  styleUrls: ['./add-edit-verifiers-modal.component.scss'],
  
})
export class AddEditVerifiersModalComponent implements OnInit {
  addEditVerifierForm: FormGroup;
  opTypeOptions = GlobalConstant.MODAL_OP;
  submittingUpdate: boolean = false;
  verifier: Verifier;
  vType: string = '';
  types = ['keypair', 'keyless'];
  VERIFIER_TYPE = MapConstant.VERIFIER_TYPE;
  isKeypairOnly: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<AddEditVerifiersModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private signaturesService: SignaturesService,
    private translate: TranslateService,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.isKeypairOnly =
      this.data.attribute ===
      GlobalConstant.SIGSTORE_ATTRIBUTE.ROOTLESS_KEYPAIR_ONLY
        ? true
        : false;

    if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
      this.addEditVerifierForm = new FormGroup({
        name: new FormControl('', Validators.required),
        comment: new FormControl(''),
        verifier_type: new FormControl(MapConstant.VERIFIER_TYPE.KEYPAIR),
        public_key: new FormControl(''),
        cert_issuer: new FormControl(''),
        cert_subject: new FormControl(''),
      });
      this.vType = MapConstant.VERIFIER_TYPE.KEYPAIR;
    } else {
      this.addEditVerifierForm = new FormGroup({
        name: new FormControl(this.data.verifier.name, Validators.required),
        comment: new FormControl(this.data.verifier.comment),
        verifier_type: new FormControl(this.data.verifier.verifier_type),
        public_key: new FormControl(this.data.verifier.public_key || ''),
        cert_issuer: new FormControl(this.data.verifier.cert_issuer || ''),
        cert_subject: new FormControl(this.data.verifier.cert_subject || ''),
      });
      this.vType = this.data.verifier.verifier_type;
    }
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  updateVerifier = () => {
    this.addEditVerifierForm.value.verifier_type = this.vType;
    this.signaturesService
      .updateVerifierData(
        Object.assign(this.addEditVerifierForm.value, {
          root_of_trust_name: this.data.rootOfTrustName,
        }),
        this.data.opType
      )
      .subscribe(
        response => {
          this.notificationService.open(
            this.data.opType === GlobalConstant.MODAL_OP.ADD
              ? this.translate.instant('signatures.msg.INSERT_VERIFIER_OK')
              : this.translate.instant('signatures.msg.UPDATE_VERIFIER_OK')
          );
          this.dialogRef.close(true);
          if (
            this.addEditVerifierForm.value.verifier_type ===
            MapConstant.VERIFIER_TYPE.KEYPAIR
          ) {
            this.addEditVerifierForm.value.cert_issuer = '';
            this.addEditVerifierForm.value.cert_subject = '';
          } else {
            this.addEditVerifierForm.value.public_key = '';
          }
          updateGridData(
            this.data.verifiers,
            [
              this.data.opType === GlobalConstant.MODAL_OP.ADD
                ? {
                    name: this.addEditVerifierForm.value.name,
                    comment: this.addEditVerifierForm.value.comment,
                    verifier_type: this.addEditVerifierForm.value.verifier_type,
                    public_key: this.addEditVerifierForm.value.public_key || '',
                    cert_issuer:
                      this.addEditVerifierForm.value.cert_issuer || '',
                    cert_subject:
                      this.addEditVerifierForm.value.cert_subject || '',
                  }
                : this.addEditVerifierForm.value,
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
                ? this.translate.instant('signatures.msg.INSERT_VERIFIER_NG')
                : this.translate.instant('signatures.msg.UPDATE_VERIFIER_NG');
            this.notificationService.open(
              this.utils.getAlertifyMsg(error.error, msg, false),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        }
      );
  };
}
