import { Injectable, SecurityContext } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilsService } from '@common/utils/app.utils';
import { SignatureActionButtonsComponent } from '@routes/signature-verifiers/partial/signature-action-buttons/signature-action-buttons.component';
import { VerifierActionButtonsComponent } from '@routes/signature-verifiers/partial/verifier-action-buttons/verifier-action-buttons.component';

@Injectable({
  providedIn: 'root'
})
export class SignaturesService {

  private readonly $win;

  constructor(
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private utils: UtilsService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  configGrids = (isWriteSignaturesAuthorized: boolean) => {

    const columnDefs4Signature = [
      {
        headerName: this.translate.instant("signatures.gridHeader.NAME"),
        field: "name",
        headerCheckboxSelection: isWriteSignaturesAuthorized,
        headerCheckboxSelectionFilteredOnly: isWriteSignaturesAuthorized,
        checkboxSelection: (params) => {
          if (params.data)
            return isWriteSignaturesAuthorized;
          return false;
        },
        cellRenderer: (params) => {
          if (params.value)
            return `<span class="${!isWriteSignaturesAuthorized ? 'left-margin-32' : ''}">
                      ${params.value}
                    </span>`;
          return false;
        },
        width: 100,
        minWidth: 100
      },
      {
        headerName: this.translate.instant("signatures.gridHeader.COMMENT"),
        field: "comment",
        width: 400,
        minWidth: 400
      },
      {
        headerName: this.translate.instant("admissionControl.TYPE"),
        field: "cfg_type",
        cellRenderer: (params) => {
          if (params) {
            let cfgType = params.value ? params.value.toUpperCase() : GlobalConstant.CFG_TYPE.CUSTOMER.toUpperCase();
            let type = MapConstant.colourMap[cfgType];
            return `<div class="type-label px-1 ${type}">${this.sanitizer.sanitize(SecurityContext.HTML,
              this.translate.instant(`group.${cfgType}`)
            )}</div>`;
          }
          return "";
        },
        width: 110,
        minWidth: 110,
        maxWidth: 110
      },
      {
        cellClass: "grid-right-align",
        suppressSorting: true,
        cellRenderer: SignatureActionButtonsComponent,
        hide: !isWriteSignaturesAuthorized,
        width: 60,
        minWidth: 60,
        maxWidth: 60
      }
    ];

    const columnDefs4Verifier = [
      {
        headerName: this.translate.instant("signatures.gridHeader.NAME"),
        field: "name",
        width: 100,
        minWidth: 100
      },
      {
        headerName: this.translate.instant("signatures.gridHeader.COMMENT"),
        field: "comment",
        width: 200,
        minWidth: 200
      },
      {
        headerName: this.translate.instant("admissionControl.TYPE"),
        field: "verifier_type",
        width: 80,
        minWidth: 80,
        maxWidth: 80
      },
      // {
      //   headerName: this.translate.instant("signatures.gridHeader.IGNORE_TLOG"),
      //   field: "ignore_tlog",
      //   width: 80,
      //   minWidth: 80
      // },
      // {
      //   headerName: this.translate.instant("signatures.gridHeader.IGNORE_SCT"),
      //   field: "ignore_sct",
      //   width: 80,
      //   minWidth: 80
      // },
      {
        headerName: this.translate.instant("signatures.gridHeader.PUBLIC_KEY"),
        field: "public_key",
        width: 120,
        minWidth: 120
      },
      {
        headerName: this.translate.instant("signatures.gridHeader.CERT_ISSUER"),
        field: "cert_issuer",
        width: 120,
        minWidth: 120
      },
      {
        headerName: this.translate.instant("signatures.gridHeader.CERT_SUBJECT"),
        field: "cert_subject",
        width: 120,
        minWidth: 120
      },
      {
        cellClass: "grid-right-align",
        suppressSorting: true,
        cellRenderer: VerifierActionButtonsComponent,
        hide: !isWriteSignaturesAuthorized,
        width: 60,
        minWidth: 60,
        maxWidth: 60
      }
    ];

    let grids = {
      gridOptions4Signatures: this.utils.createGridOptions(columnDefs4Signature, this.$win),
      gridOptions4Verifiers: this.utils.createGridOptions(columnDefs4Verifier, this.$win)
    };

    return grids;
  };


  getSignaturesData = () => {
    return GlobalVariable.http.get(PathConstant.SIGNATURE_URL);
  };

  getVerifiersData = (rootOfTrustName: string) => {
    return GlobalVariable.http.get(PathConstant.VERIFIER_URL, {params: { rootOfTrustName: rootOfTrustName }});
  };

  updateSigstoreData = (payload, opType: string) => {
    return GlobalVariable.http[
      opType === GlobalConstant.MODAL_OP.ADD ?
      'post' :
      'patch'
    ](PathConstant.SIGNATURE_URL, payload).pipe();
  };

  deleteSigstoreData = (rootOfTrustName: string) => {
    return GlobalVariable.http.delete(PathConstant.SIGNATURE_URL, {params: { rootOfTrustName: rootOfTrustName }}).pipe();
  };

  getVerifierData = (rootOfTrustName) => {
    return GlobalVariable.http.get(PathConstant.VERIFIER_URL, {params: { rootOfTrustName: rootOfTrustName }}).pipe();
  };

  updateVerifierData = (payload, opType: string) => {
    return GlobalVariable.http[
      opType === GlobalConstant.MODAL_OP.ADD ?
      'post' :
      'patch'
    ](PathConstant.VERIFIER_URL, payload).pipe();
  };

  deleteVerifierData = (rootOfTrustName: string, verifierName: string) => {
    return GlobalVariable.http.delete(PathConstant.VERIFIER_URL, {params: { rootOfTrustName: rootOfTrustName, verifierName: verifierName }}).pipe();
  };
}
