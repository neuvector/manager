import { Component, OnInit } from '@angular/core';
import { GridOptions, GridApi } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { PathConstant } from '@common/constants/path.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { SignaturesService } from '@services/signatures.service';
import { AddEditSignatureVerifiersModalComponent } from './partial/add-edit-signature-verifiers-modal/add-edit-signature-verifiers-modal.component';
import { AddEditVerifiersModalComponent } from './partial/add-edit-verifiers-modal/add-edit-verifiers-modal.component';
import {
  Signature,
  SignaturePayload,
  Verifier,
} from '@common/types/signatures/signature';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import * as $ from 'jquery';


@Component({
  standalone: false,
  selector: 'app-signature-verifiers',
  templateUrl: './signature-verifiers.component.html',
  styleUrls: ['./signature-verifiers.component.scss'],
  
})
export class SignatureVerifiersComponent implements OnInit {
  refreshing$ = new Subject();
  isWriteSignaturesAuthorized: boolean = false;
  gridOptions: any;
  gridOptions4Signatures!: GridOptions;
  gridOptions4Verifiers!: GridOptions;
  gridApi4Signatures!: GridApi;
  gridApi4Verifiers!: GridApi;
  filteredCount: number = 0;
  signatures: Signature[] = [];
  verifiers: Verifier[] = [];
  selectedSignatures!: Signature[];
  selectedSignature!: Signature;
  selectedVerifier!: Verifier;
  index4Signature!: number;
  index4Verifier!: number;
  filtered: boolean = false;
  context = { componentParent: this };
  $win: any;

  get signatureCount() {
    if (this.signatures?.length) return this.signatures.length;
    else return 0;
  }

  constructor(
    private dialog: MatDialog,
    private authUtilsService: AuthUtilsService,
    private translate: TranslateService,
    private signaturesService: SignaturesService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.isWriteSignaturesAuthorized =
      this.authUtilsService.getDisplayFlag('write_sigstore') &&
      !this.authUtilsService.userPermission.isNamespaceUser;

    this.gridOptions = this.signaturesService.configGrids(
      this.isWriteSignaturesAuthorized
    );
    this.gridOptions4Signatures = this.gridOptions.gridOptions4Signatures;
    this.gridOptions4Signatures.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi4Signatures = params.api;
      }
      setTimeout(() => {
        if (params && params.api) {
          params.api.sizeColumnsToFit();
        }
      }, 300);
      $win.on(GlobalConstant.AG_GRID_RESIZE, () => {
        setTimeout(() => {
          if (params && params.api) {
            params.api.sizeColumnsToFit();
          }
        }, 100);
      });
    };
    this.gridOptions4Verifiers = this.gridOptions.gridOptions4Verifiers;
    this.gridOptions4Verifiers.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi4Verifiers = params.api;
      }
      setTimeout(() => {
        if (params && params.api) {
          params.api.sizeColumnsToFit();
        }
      }, 300);
      $win.on(GlobalConstant.AG_GRID_RESIZE, () => {
        setTimeout(() => {
          if (params && params.api) {
            params.api.sizeColumnsToFit();
          }
        }, 100);
      });
    };
    this.gridOptions4Signatures.onSelectionChanged =
      this.onSelectionChanged4Signature;
    this.gridOptions4Verifiers.onSelectionChanged =
      this.onSelectionChanged4Verifier;

    this.refresh();
  }

  refresh = (index: number = 0) => {
    this.getSignatures(index);
  };

  getSignatures = (index: number) => {
    this.signaturesService
      .getSignaturesData()
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        (response: any) => {
          const signaturePayload: SignaturePayload[] =
            response.roots_of_trust || [];
          let signatureArray: Signature[] = [];
          if (signaturePayload) {
            for (const payload of signaturePayload) {
              const signature: Signature = {
                name: payload.name,
                comment: payload.comment,
                rekor_public_key: payload.rekor_public_key,
                root_cert: payload.root_cert,
                sct_public_key: payload.sct_public_key,
                cfg_type: payload.cfg_type,
                verifiers: payload.verifiers,
                attribute: '',
              };

              //Set the attribute based on is_private and rootless_keypairs_only
              if (!payload.is_private && !payload.rootless_keypairs_only) {
                signature.attribute = GlobalConstant.SIGSTORE_ATTRIBUTE.PUBLIC;
              } else if (
                !payload.is_private &&
                payload.rootless_keypairs_only
              ) {
                signature.attribute =
                  GlobalConstant.SIGSTORE_ATTRIBUTE.ROOTLESS_KEYPAIR_ONLY;
              } else if (
                payload.is_private &&
                !payload.rootless_keypairs_only
              ) {
                signature.attribute = GlobalConstant.SIGSTORE_ATTRIBUTE.PRIVATE;
              }

              signatureArray.push(signature);
            }
          }

          this.signatures = signatureArray;

          // this.filteredCount = this.signatures.length;
          this.gridApi4Signatures!.setGridOption('rowData', this.signatures);
          if (!this.signatures || this.signatures.length === 0)
            this.gridApi4Verifiers!.setGridOption('rowData', []);
          setTimeout(() => {
            let rowNode =
              this.gridApi4Signatures!.getDisplayedRowAtIndex(index);
            rowNode?.setSelected(true);
          }, 200);
        },
        error => {}
      );
  };

  filterCountChanged4Signature = (results: number) => {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.signatureCount;
  };

  openAddEditSignatureModal = () => {
    const addEditDialogRef = this.dialog.open(
      AddEditSignatureVerifiersModalComponent,
      {
        width: '80%',
        data: {
          opType: GlobalConstant.MODAL_OP.ADD,
          gridOptions4Signatures: this.gridOptions4Signatures,
          index4Signature: this.index4Signature,
          gridApi: this.gridApi4Signatures!,
          sigstores: this.signatures,
        },
      }
    );
  };

  openAddEditVerifierModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditVerifiersModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
        gridOptions4Verifiers: this.gridOptions4Verifiers,
        index4Verifier: this.index4Verifier,
        gridApi: this.gridApi4Verifiers!,
        verifiers: this.verifiers,
        rootOfTrustName: this.selectedSignature.name,
        attribute: this.selectedSignature.attribute,
      },
    });
  };

  openImportSigstoreModal = () => {
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl: PathConstant.SIGNATURE_IMPORT_URL,
        importMsg: {
          success: this.translate.instant('waf.msg.IMPORT_FINISH'),
          error: this.translate.instant('waf.msg.IMPORT_FAILED'),
        },
      },
    });
    importDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.refresh();
      }, 500);
    });
  };

  private onSelectionChanged4Signature = () => {
    this.selectedSignatures = this.gridApi4Signatures!.getSelectedRows();
    this.selectedSignature = this.selectedSignatures[0];
    this.index4Signature = this.signatures.findIndex(
      signature => signature.name === this.selectedSignature?.name
    );
    this.getVeirfier(this.selectedSignature?.name);
  };
  private onSelectionChanged4Verifier = () => {
    this.selectedVerifier = this.gridApi4Verifiers!.getSelectedRows()[0];
    this.index4Verifier = this.verifiers.findIndex(
      verifier => verifier.name === this.selectedVerifier?.name
    );
  };

  private getVeirfier = (sigstoreName: string) => {
    if (sigstoreName) {
      this.signaturesService.getVerifiersData(sigstoreName).subscribe(
        (response: any) => {
          setTimeout(() => {
            this.verifiers = response.verifiers || [];
            this.gridApi4Verifiers!.setGridOption('rowData', this.verifiers);
            if (this.verifiers.length > 0) {
              let rowNode = this.gridApi4Verifiers!.getDisplayedRowAtIndex(0);
              rowNode!.setSelected(true);
              this.gridApi4Verifiers!.sizeColumnsToFit();
            }
          }, 200);
        },
        error => {}
      );
    }
  };

  private convertAPIResponse = (response: any): any[] => {
    return Object.entries(response).map(([k, v]) => {
      let keyDestructoredRes = k.split('/');
      let name = keyDestructoredRes[keyDestructoredRes.length - 1];
      return { ...(v as any), name } as any;
    });
  };
}
