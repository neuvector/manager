import { Inject, Injectable, SecurityContext } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PathConstant } from '@common/constants/path.constant';
import * as $ from 'jquery';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { DomSanitizer } from '@angular/platform-browser';
import { BytesPipe } from '@common/pipes/app.pipes';
import { GridOptions } from 'ag-grid-community';
import { forkJoin, Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
import { capitalizeWord, parseDivideStyle } from '@common/utils/common.utils';
import { AbstractControl } from '@angular/forms';
import {
  AdmissionRule,
  AdmissionStateRec,
  AdmRuleSubCriterion
} from '@common/types/admission/admission';
import { ActionButtonsComponent } from '@components/admission-rules/partial/action-buttons/action-buttons.component';

@Injectable({
  providedIn: 'root',
})
export class AdmissionRulesService {
  private readonly $win;
  public admissionRules: Array<any>;
  public id: number;
  public admissionRule4Edit: any;
  public PSP_CRITERIA = [
    {
      name: {
        originalName: 'runAsPrivileged',
        displayName: 'run_As_Privileged',
      },
      operator: '=',
      value: 'true',
    },
    {
      name: {
        originalName: 'runAsRoot',
        displayName: 'run_As_Root',
      },
      operator: '=',
      value: 'true',
    },
    {
      name: {
        originalName: 'shareIpcWithHost',
        displayName: 'share_Ipc_With_Host',
      },
      operator: '=',
      value: 'true',
    },
    {
      name: {
        originalName: 'shareNetWithHost',
        displayName: 'share_Net_With_Host',
      },
      operator: '=',
      value: 'true',
    },
    {
      name: {
        originalName: 'sharePidWithHost',
        displayName: 'share_Pid_With_Host',
      },
      operator: '=',
      value: 'true',
    },
    {
      name: {
        originalName: 'allowPrivEscalation',
        displayName: 'allow_Priv_Escalation',
      },
      operator: '=',
      value: 'true',
    },
  ];

  constructor(
    public sanitizer: DomSanitizer,
    public translate: TranslateService,
    public translate4Pdf: TranslateService,
    private utils: UtilsService,
    public bytesPipe: BytesPipe
  ) {}

  configRuleGrid = isWriteAdmissionRuleAuthorized => {
    let gridOptions: GridOptions;
    let gridOptions4MatchingTest: GridOptions;
    const $win = $(GlobalVariable.window);
    const columnDefs = [
      {
        headerName: this.translate.instant('policy.gridHeader.ID'),
        field: 'id',
        headerCheckboxSelection: isWriteAdmissionRuleAuthorized,
        headerCheckboxSelectionFilteredOnly: isWriteAdmissionRuleAuthorized,
        checkboxSelection: params => {
          return this.idSelectionFunc(params, isWriteAdmissionRuleAuthorized);
        },
        cellRenderer: params => {
          return this.idRendererFunc(params, isWriteAdmissionRuleAuthorized);
        },
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      {
        headerName: this.translate.instant('admissionControl.COMMENT'),
        field: 'comment',
        width: 240,
        minWidth: 150,
        colSpan: function(params) {
          if (params.data && params.data.id === -1) {
            return 4;
          }
          return 1;
        },
        cellRenderer: params => {
          return this.commentRendererFunc(params);
        },
      },
      {
        headerName: this.translate.instant('admissionControl.CRITERIA'),
        field: 'criteria',
        cellRenderer: params => {
          return this.criteriaRenderFunc(params);
        },
        width: 550,
      },
      {
        headerName: this.translate.instant('admissionControl.RULE_TYPE'),
        field: 'rule_type',
        cellRenderer: params => {
          return this.typeRenderFunc(params);
        },
        width: 85,
        minWidth: 85,
        maxWidth: 85,
      },
      {
        headerName: this.translate.instant('admissionControl.TYPE'),
        field: 'cfg_type',
        cellRenderer: params => {
          return this.cfgTypeRenderFunc(params);
        },
        width: 85,
        minWidth: 85,
        maxWidth: 85,
      },
      {
        cellRenderer: ActionButtonsComponent,
        cellClass: ["grid-right-align"],
        width: 100,
        maxWidth: 100,
        minWidth: 100
      }
    ];

    gridOptions = {
      defaultColDef: {
        resizable: true,
        sortable: true,
      },
      headerHeight: 56,
      rowHeight: 56,
      animateRows: true,
      suppressDragLeaveHidesColumns: true,
      columnDefs: columnDefs,
      rowData: null,
      rowSelection: 'multiple',
      isRowSelectable: params => {
        return this.idSelectionFunc(params, isWriteAdmissionRuleAuthorized);
      },
      rowClassRules: {
        'disabled-row': params => {
          if (!params.data) return false;
          if (params.data.disable) {
            return true;
          }
          return false;
        },
        'critical-row': params => {
          if (!params.data) return false;
          return params.data.id === -1 && params.data.critical;
        },
      },
      onGridReady: function (params) {
        setTimeout(() => {
          params.api.sizeColumnsToFit();
        }, 100);
        $win.on(GlobalConstant.AG_GRID_RESIZE, () => {
          setTimeout(() => {
            params.api.sizeColumnsToFit();
          }, 1000);
        });
      },
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };

    return gridOptions;
  };

  configMatchingTestGrid = () => {
    let gridOptions: GridOptions;
    const $win = $(GlobalVariable.window);

    const columnDefs = [
      {
        headerName: this.translate.instant("admissionControl.matchingTestGrid.INDEX"),
        field: "index",
        width: 60,
        minWidth: 60,
        maxWidth: 60
      },
      {
        headerName: this.translate.instant("admissionControl.matchingTestGrid.KIND"),
        field: "kind",
        width: 120,
      },
      {
        headerName: this.translate.instant("admissionControl.matchingTestGrid.NAME"),
        field: "name",
        width: 120,
      },
      {
        headerName: this.translate.instant("admissionControl.matchingTestGrid.ALLOWED"),
        field: "allowed",
        cellRenderer: (params) => {
          return params.value ?
            `<em class="fa fa-check text-success" aria-hidden="true"></em>` :
            `<em class="fa fa-times text-danger" aria-hidden="true"></em>`;
        },
        width: 80,
        minWidth: 80,
        maxWidth: 80
      },
      {
        headerName: this.translate.instant("admissionControl.matchingTestGrid.MSG"),
        field: "message",
        width: 400
      }
    ];

    gridOptions = this.utils.createGridOptions(columnDefs, $win);
    gridOptions.defaultColDef = {
      flex: 1,
      cellClass: 'cell-wrap-text',
      autoHeight: true,
      sortable: true,
      resizable: true,
    };
    gridOptions.onColumnResized = function(params) {
      params.api.resetRowHeights();
    };

    return gridOptions;
  };

  idSelectionFunc = (params, isWriteAdmissionRuleAuthorized) => {
    if (params.data) {
      return (
        isWriteAdmissionRuleAuthorized &&
        params.data.category !== GlobalConstant.GLOBAL
      );
    }
    return false;
  };

  idRendererFunc = (params, isWriteAdmissionRuleAuthorized) => {
    let id = '';
    if (params && params.value && params.value > 0) {
      if (
        (isWriteAdmissionRuleAuthorized &&
          params.data.category !== GlobalConstant.GLOBAL) ||
        !isWriteAdmissionRuleAuthorized
      ) {
        id = params.value;
      } else {
        id = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${params.value}`;
      }
      return this.sanitizer.sanitize(SecurityContext.HTML, id);
    }
    return '';
  };

  commentRendererFunc = params => {
    if (params && params.value) {
      return this.sanitizer.sanitize(
        SecurityContext.HTML,
        params.value.length > 60
          ? `${params.value.substring(0, 60)}...`
          : params.value
      );
    }
    return '';
  };

  criteriaRenderFunc = params => {
    let criteriaArray = params.value.map(criterion => {
      return this.parseTag(GlobalConstant.CRITERIA_PATTERN, criterion).tagName;
    });
    return this.sanitizer.sanitize(
      SecurityContext.HTML,
      criteriaArray.join(', ')
    );
  };

  typeRenderFunc = params => {
    if (params.value && params.data) {
      let type = params.value === 'exception' ? 'Allow' : params.value;
      return `<span ng-class="{\'policy-remove\': data.remove}" class="action-label ${
        params.data.disable
          ? MapConstant.colourMap['disabled_background']
          : MapConstant.colourMap[type.toLowerCase()]
      }">${this.sanitizer.sanitize(
        SecurityContext.HTML,
        this.translate.instant('admissionControl.' + type.toUpperCase())
      )}</span>`;
    }
    return '';
  };

  cfgTypeRenderFunc = params => {
    if (params && params.value) {
      let type = params.data.disable
        ? MapConstant.colourMap['disabled-rule']
        : MapConstant.colourMap[params.value.toUpperCase()];
      return `<div class="action-label nv-label ${type}">
        ${this.sanitizer.sanitize(
          SecurityContext.HTML,
          this.translate.instant(`group.${params.value.toUpperCase()}`)
        )}</div>`;
    }
    return '';
  };

  parseTag = (CRITERIA_PATTERN: any, criterion: any) => {
    let tagName = "";
    let valid = false;
    if (CRITERIA_PATTERN.NAME_ONLY.includes(criterion.name)) {
      tagName = this.translate.instant(
        `admissionControl.names.${parseDivideStyle(criterion.name).toUpperCase()}`
      );
      valid = true;
    } else if (CRITERIA_PATTERN.CVE_COUNT.includes(criterion.name) && criterion.sub_criteria.some(elem => elem.value)) {
      tagName = this.translate.instant(
        `admissionControl.display.${parseDivideStyle(
          criterion.name
        ).toUpperCase()}_WITH_REPORT_DAYS`,
        {
          comparison: capitalizeWord(this.translate.instant(`admissionControl.operators.text.${criterion.op}`)),
          count: criterion.value
        }
      ) + " " +
      this.translate.instant(
        `admissionControl.display.${parseDivideStyle(
          criterion.sub_criteria[0].op)}`,
        {
          days: criterion.sub_criteria[0].value
        }
      );
      valid = true;
    } else if (CRITERIA_PATTERN.CVE_SCORE.includes(criterion.name) && criterion.sub_criteria.length > 0) {
      tagName = this.translate.instant(
        `admissionControl.display.${parseDivideStyle(criterion.name).toUpperCase()}_WITH_COUNT`,
        {
          score: criterion.value,
          count: criterion.sub_criteria[0].value,
          countComparison: capitalizeWord(this.translate.instant(`admissionControl.operators.text.${criterion.op}`)),
          scoreComparison: this.translate.instant(`admissionControl.display.cveScore.${criterion.sub_criteria[0].op}`)
        }
      );
      valid = true;
    } else if (CRITERIA_PATTERN.RESOURCE.includes(criterion.name)) {
      tagName = this.translate.instant(
        `admissionControl.display.${parseDivideStyle(
          criterion.name
        ).toUpperCase()}`,
        {
          details: criterion.sub_criteria
          .map((subCriterion) => {
            if (subCriterion.name.toLowerCase().includes("memory") && !subCriterion.unit) {
              return `${this.translate.instant(`admissionControl.names.${parseDivideStyle(subCriterion.name).toUpperCase()}_S`)}${subCriterion.op ? subCriterion.op : undefined}${subCriterion.value ? this.bytesPipe.transform(subCriterion.value, 2) : undefined}`
            }
            return `${this.translate.instant(`admissionControl.names.${parseDivideStyle(subCriterion.name).toUpperCase()}_S`)}${subCriterion.op ? subCriterion.op : undefined}${subCriterion.value ? subCriterion.value : undefined}${subCriterion.unit ? subCriterion.unit : ""}`
          })
          .filter(tag => !tag.includes("undefined"))
          .join(", ")
        }
      ).replace(/\&gt\;/g, ">").replace(/\&lt\;/g, "<");
      if (tagName !== this.translate.instant(`admissionControl.display.${parseDivideStyle(
        criterion.name
      ).toUpperCase()}`,{details: ""})) {
        valid = true;
      }
    } else {
      let displayValue =
        criterion.value.length > 30
          ? `${criterion.value.substring(0, 30)}...`
          : criterion.value;
      displayValue =
        criterion.op.toLowerCase().indexOf("contains") >= 0
          ? `[${displayValue}]`
          : displayValue;
      tagName = `${this.translate.instant(
        `admissionControl.names.${parseDivideStyle(criterion.name).toUpperCase()}`
      )} ${this.translate.instant(
        `admissionControl.operators.${
          GlobalConstant.SINGLE_VALUE_CRITERIA.includes(criterion.name)
            ? `${criterion.op.toUpperCase()}_SINGLE`
            : criterion.op.toUpperCase()
        }`
      )} ${displayValue}`;
      valid = true;
    }
    return {
      tagName,
      valid
    }
  };

  checkAndAppendCriteria = (tagName, criterion: any, currCriteriaControl: AbstractControl) => {
    let isDuplicated = false;
    currCriteriaControl.setValue(currCriteriaControl.value.filter(currCriterion => {
      if (currCriterion.name === criterion.name) {
        isDuplicated = true;
      }
      return (
        currCriterion.value.name !== criterion.name ||
        currCriterion.value.op !== criterion.op
      );
    }));
    if (!isDuplicated && criterion.sub_criteria && criterion.sub_criteria.some(elem => elem.value !== "")) {
      if (criterion.name.toLowerCase() === "resourcelimit") {
        criterion = criterion.sub_criteria.map(elem => {
          elem.value = this.parseValueByByteUnit(elem.value, elem.unit);
          return elem;
        })
      }
    }
    let currCriteria = currCriteriaControl.value;
    currCriteria.push({
      name: tagName,
      value: {
        sub_criteria: criterion.sub_criteria && Array.isArray(criterion.sub_criteria) ? criterion.sub_criteria.filter(elem => elem.value) : [],
        name: criterion.name,
        op: GlobalConstant.CRITERIA_PATTERN.NAME_ONLY.includes(criterion.name) ? "=" : criterion.op,
        value: GlobalConstant.CRITERIA_PATTERN.NAME_ONLY.includes(criterion.name) ? "true" : criterion.value
      }
    })
    return currCriteria;
  };

  removeCriterionFromChip = (criterion4Remove, criteriaControl) => {
    let criteria = criteriaControl.value;
    const index = criteria.findIndex(criterion => {
      return criterion4Remove.name === criterion.name;
    });

    if (index >= 0) {
      criteria.splice(index, 1);
    }
    return criteria;
  };

  criterionSelectedInChip = (selectedCriterion) => {
    return [
      {
        name: selectedCriterion.value.name,
        op: selectedCriterion.value.op,
        value: selectedCriterion.value.value
      },
      selectedCriterion.value.sub_criteria
    ]
  };

  getAdmissionData = scope => {
    let state: Observable<AdmissionStateRec> = GlobalVariable.http
      .get<AdmissionStateRec>(PathConstant.ADMCTL_STATE_URL)
      .pipe();
    let rules: Observable<Array<AdmissionRule>> = !!scope
      ? GlobalVariable.http
          .get<Array<AdmissionRule>>(PathConstant.ADMISSION_URL, {
            params: { scope: scope },
          })
          .pipe(pluck('rules'))
      : GlobalVariable.http
          .get<Array<AdmissionRule>>(PathConstant.ADMISSION_URL)
          .pipe(pluck('rules'));
    let options = GlobalVariable.http
      .get(PathConstant.ADMCTL_CONDITION_OPTION_URL)
      .pipe(pluck('admission_options'));
    return forkJoin([state, rules, options]).pipe();
  };

  getAdmissionState = () => {
    return GlobalVariable.http
      .get<AdmissionStateRec>(PathConstant.ADMCTL_STATE_URL)
      .pipe();
  };

  toggleAdmissionRules = (rule: AdmissionRule) => {
    let payload = rule;
    return this.addUpdateAdmissionRules(payload);
  };

  addUpdateAdmissionRules = (payload: any, event = GlobalConstant.MODAL_OP.EDIT) => {
    let methodMap = new Map();
    methodMap.set(GlobalConstant.MODAL_OP.ADD, "post");
    methodMap.set(GlobalConstant.MODAL_OP.EDIT, "patch");
    return GlobalVariable.http[methodMap.get(event)](PathConstant.ADMISSION_SINGLE_URL, payload).pipe();
  };

  removeAdmissionRule = (cfg_type: string, id: number) => {
    return GlobalVariable.http
      .delete(
        PathConstant.ADMISSION_SINGLE_URL,
        {
          params: {
            scope: cfg_type === GlobalConstant.CFG_TYPE.FED ?
              GlobalConstant.SCOPE.FED :
              GlobalConstant.SCOPE.LOCAL,
            id: id
          }
        }
      )
      .pipe();
  };

  exportAdmissionRules = (rules: Array<AdmissionRule> = [], isConfigSelected: boolean) => {
    let payload = {
      ids: rules.map(rule => rule.id).filter(id => id !== -1),
      export_config: isConfigSelected
    };
    return GlobalVariable.http.post(PathConstant.EXPORT_ADM_CTRL, payload, { observe: 'response', responseType: 'text' }).pipe();
  };

  updateAdmissionState = (payload) => {
    return GlobalVariable.http.patch(PathConstant.ADMCTL_STATE_URL, payload).pipe();
  };

  doK8sTest = () => {
    return GlobalVariable.http.get(PathConstant.ADM_CTRL_K8S_TEST).pipe();
  };

  updateRulePromotion = (payload) => {
    return GlobalVariable.http.post(PathConstant.PROMOTE_ADMISSION_RULE, payload).pipe();
  };

  getI18NMessages = () => {
    this.translate4Pdf.resetLang("en");
    return {
      title: this.translate4Pdf.instant("admissionControl.matchingTestGrid.TITLE"),
      unavailableProp: this.translate4Pdf.instant("admissionControl.matchingTestGrid.UNAVAILABLE_PROP"),
      trHeader: {
        index: this.translate4Pdf.instant("admissionControl.matchingTestGrid.INDEX"),
        kind: this.translate4Pdf.instant("admissionControl.matchingTestGrid.KIND"),
        name: this.translate4Pdf.instant("admissionControl.matchingTestGrid.NAME"),
        allowed: this.translate4Pdf.instant("admissionControl.matchingTestGrid.ALLOWED"),
        msg: this.translate4Pdf.instant("admissionControl.matchingTestGrid.MSG")
      },
      data: {
        denied: this.translate4Pdf.instant("securityEvent.DENY")
      },
      others: {
        logoName: this.translate4Pdf.instant("partner.general.LOGO_NAME"),
        reportTitle: this.translate4Pdf.instant("admissionControl.matchingTestGrid.REPORT_TITLE"),
        topVulnerableImages: this.translate4Pdf.instant("scan.report.others.TOP_VULNERABLE_IMAGES"),
        footerText: this.translate4Pdf.instant("containers.report.footer"),
        headerText: this.translate4Pdf.instant("partner.containers.report.header")
      }
    };
  };

  formatContent = (docData) => {
    let metadata = docData.metadata;
    let images = docData.images;

    let docDefinition = {
      info: {
        title: metadata.others.reportTitle,
        author: "NeuVector",
        subject: "Admission Control Matching Test Report",
        keywords: "admission test"
      },
      headerData: {
        text: metadata.others.headerText,
        alignment: "center",
        italics: true,
        style: "pageHeader"
      },
      footerData: {
        line: {
          image: images.FOOTER_LINE,
          width: 650,
          height: 1,
          margin: [50, 5, 0, 10]
        },
        text: metadata.others.footerText
      },
      header: function(currentPage) {
        if (currentPage === 2 || currentPage === 3) {
          return {
            text: metadata.others.headerText,
            alignment: "center",
            italics: true,
            style: "pageHeader"
          };
        }
        return {};
      },
      footer: function(currentPage) {
        if (currentPage > 1) {
          return {
            stack: [
              {
                image: images.FOOTER_LINE,
                width: 650,
                height: 1,
                margin: [50, 5, 0, 10]
              },
              {
                text: [
                  { text: metadata.others.footerText, italics: true },
                  { text: " |   " + currentPage }
                ],
                alignment: "right",
                style: "pageFooter"
              }
            ]
          };
        }
        return {};
      },
      pageSize: "LETTER",
      pageOrientation: "landscape",
      pageMargins: [50, 50, 50, 45],
      defaultStyle: {
        fontSize: 7,
        columnGap: 10
      },
      content: [
        {
          image: images.BACKGROUND,
          width: 1000,
          absolutePosition: { x: 0, y: 300 }
        },
        {
          image: images.ABSTRACT,
          width: 450
        },
        {
          image: images[metadata.others.logoName],
          width: 400,
          absolutePosition: { x: 350, y: 180 }
        },
        {
          text: metadata.others.reportTitle,
          fontSize: 34,
          color: "#777",
          bold: true,
          absolutePosition: { x: 150, y: 450 },
          pageBreak: "after"
        },
        {
          toc: {
            title: {
              text: metadata.others.reportTitle,
              style: "tocTitle"
            },
            numberStyle: "tocNumber"
          },
          margin: [60, 35, 20, 60],
          pageBreak: "after"
        },
        {
          text: [
            {
              text: "Test Result",
              style: "contentHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: "#4863A0",
                margin: [80, 15, 0, 60]
              }
            }
          ]
        },
        {
          text: [
            {
              text: `${metadata.unavailableProp}: `,
              style: "content",
            },
            {
              text: docData.data.props_unavailable.join(", "),
              color: "#4863A0",
              fontSize: 10
            }
          ],
          margin: [0, 10, 5, 5]
        },
        {
          style: "tableExample",
          table: {
            headerRows: 1,
            dontBreakRows: false,
            widths: ["6%", "8%", "10%", "6%", "70%"],
            body: [
              [
                { text: metadata.trHeader.index, style: "tableHeader" },
                { text: metadata.trHeader.kind, style: "tableHeader" },
                { text: metadata.trHeader.name, style: "tableHeader" },
                { text: metadata.trHeader.allowed, style: "tableHeader" },
                { text: metadata.trHeader.msg, style: "tableHeader" }
              ]
            ]
          }
        }
      ],
      styles: {
        pageHeader: {
          fontSize: 14,
          italic: true,
          bold: true,
          color: "grey",
          margin: [0, 10, 5, 5]
        },
        pageFooter: {
          fontSize: 12,
          color: "grey",
          margin: [0, 5, 55, 5]
        },
        pageFooterImage: {
          width: 750,
          height: 1,
          margin: [50, 5, 10, 10]
        },
        tocTitle: {
          fontSize: 22,
          color: "#566D7E",
          lineHeight: 2
        },
        tocNumber: {
          italics: true,
          fontSize: 15
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          alignment: "center"
        },
        contentHeader: {
          fontSize: 16,
          bold: true,
          color: "#3090C7",
          margin: [0, 10, 0, 10]
        },
        contentSubHeader: {
          fontSize: 14,
          bold: true,
          color: "black",
          margin: [0, 10, 0, 10]
        },
        content: {
          fontSize: 10,
          margin: [5, 5, 5, 5]
        },
        title: {
          bold: true,
          fontSize: 8
        },
        subTitle: {
          bold: true,
          fontSize: 7
        },
        success: {
          bold: true,
          color: "#64a150",
          fontSize: 8
        },
        error: {
          bold: true,
          color: "#e91e63",
          fontSize: 8
        }
      }
    };

    if (docData.data.results.length > 0) {
      for (let item of docData.data.results) {
        docDefinition.content[7].table?.body.push(
          this._getRowData(item)
        );
      }
    }
  };

  private _getRowData = (item) => {
    let index = item.index;
    let kind = item.kind;
    let name = item.name
    let allowed = item.allowed ? {text: "Allowed", style: "success"} : {text: "Denied", style: "error"};
    let msg = item.message
    return [index, kind, name, allowed, msg];
  };

  private parseValueByByteUnit = (value, unit) => {
    let numberVal = Number(value);
    if (isNaN(numberVal)) return "";
    switch (unit) {
      case "KB": return (numberVal * (1 << 10)).toString();
      case "MB": return (numberVal * (1 << 20)).toString();
      case "GB": return (numberVal * (1 << 30)).toString();
      default: return value;
    }
  };
}
