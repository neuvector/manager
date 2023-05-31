import { Component, OnInit } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { MultiClusterService } from '@services/multi-cluster.service';
import { SignaturesService } from '@services/signatures.service';
import { AddEditSignatureVerifiersModalComponent } from './partial/add-edit-signature-verifiers-modal/add-edit-signature-verifiers-modal.component';
import { AddEditVerifiersModalComponent } from './partial/add-edit-verifiers-modal/add-edit-verifiers-modal.component';
import { Signature, Verifier } from '@common/types/signatures/signature';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';

@Component({
  selector: 'app-signature-verifiers',
  templateUrl: './signature-verifiers.component.html',
  styleUrls: ['./signature-verifiers.component.scss']
})
export class SignatureVerifiersComponent implements OnInit {

  refreshing$ = new Subject();
  isWriteSignaturesAuthorized: boolean = false;
  gridOptions: any;
  gridOptions4Signatures!: GridOptions;
  gridOptions4Verifiers!: GridOptions;
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
  private _switchClusterSubscription;

  get signatureCount() {
    if(this.signatures?.length)
      return this.signatures.length;
    else return 0;
  }

  constructor(
    private dialog: MatDialog,
    private authUtilsService: AuthUtilsService,
    private multiClusterService: MultiClusterService,
    private notificationService: NotificationService,
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
    this.gridOptions4Verifiers = this.gridOptions.gridOptions4Verifiers;
    this.gridOptions4Signatures.onSelectionChanged =
      this.onSelectionChanged4Signature;
    this.gridOptions4Verifiers.onSelectionChanged =
      this.onSelectionChanged4Verifier;

    this.refresh();

    //refresh the page when it switched to a remote cluster
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
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
          this.signatures = response.roots_of_trust || [];
          this.filteredCount = this.signatures.length;
          if (this.filteredCount === 0)
            this.gridOptions4Verifiers.api!.setRowData([]);
          setTimeout(() => {
            let rowNode =
              this.gridOptions4Signatures.api!.getDisplayedRowAtIndex(index);
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
    const addEditDialogRef = this.dialog.open(AddEditSignatureVerifiersModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
        gridOptions4Signatures: this.gridOptions4Signatures,
        index4Signature: this.index4Signature,
        gridApi: this.gridOptions4Signatures.api!,
        sigstores: this.signatures
      },
    });
  };

  openAddEditVerifierModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditVerifiersModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
        gridOptions4Verifiers: this.gridOptions4Verifiers,
        index4Verifier: this.index4Verifier,
        gridApi: this.gridOptions4Verifiers.api!,
        verifiers: this.verifiers,
        rootOfTrustName: this.selectedSignature.name
      },
    });
  };


  openImportSigstoreModal = () =>{
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
    this.selectedSignatures = this.gridOptions4Signatures.api!.getSelectedRows();
    this.selectedSignature = this.selectedSignatures[0];
    this.index4Signature = this.signatures.findIndex(
      signature => signature.name === this.selectedSignature.name
    );
    this.getVeirfier(this.selectedSignature.name);
  };
  private onSelectionChanged4Verifier = () => {
    this.selectedVerifier = this.gridOptions4Verifiers.api!.getSelectedRows()[0];
    this.index4Verifier = this.verifiers.findIndex(
      verifier => verifier.name === this.selectedVerifier.name
    );
  };

  private getVeirfier = (sigstoreName: string) => {
    this.signaturesService
      .getVerifiersData(sigstoreName)
      .subscribe(
        (response: any) => {
          setTimeout(() => {
            this.verifiers = response.verifiers || [];
            this.gridOptions4Verifiers.api!.setRowData(this.verifiers);
            if (this.verifiers.length > 0) {
              let rowNode = this.gridOptions4Verifiers.api!.getDisplayedRowAtIndex(0);
              rowNode!.setSelected(true);
              this.gridOptions4Verifiers.api!.sizeColumnsToFit();
            }
          }, 200);
        },
        error => {}
      );
  };

  private convertAPIResponse = (response: any): any[] => {
    return Object.entries(response).map(
      ([k, v]) => {
        let keyDestructoredRes = k.split('/');
        let name = keyDestructoredRes[keyDestructoredRes.length - 1];
        return Object.assign(v, {name: name}) as any;
      }
    );
  };

}
