import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { GlobalConstant } from "@common/constants/global.constant";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AdmissionRulesService } from '@common/services/admission-rules.service';
import { parseDivideStyle } from '@common/utils/common.utils';
import { AdmRuleCriterion, AdmRuleSubCriterion } from '@common/types/admission/admission';
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { BytesPipe } from "@common/pipes/app.pipes";
import { TranslateService } from '@ngx-translate/core';
import { JsonEditorComponent, JsonEditorOptions, JsonEditorTreeNode } from 'ang-jsoneditor';
import { getValueType4Text, groupBy, updateGridData } from '@common/utils/common.utils';
import { NotificationService } from '@services/notification.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-add-edit-admission-rule-modal',
  templateUrl: './add-edit-admission-rule-modal.component.html',
  styleUrls: ['./add-edit-admission-rule-modal.component.scss']
})
export class AddEditAdmissionRuleModalComponent implements OnInit {

  modalOp: any;
  addEditAdmissionRuleForm: FormGroup;
  criteriaOptions: any;
  criterionNameList: Array<any> = [];
  criterionOperatorList: Array<any> = [];
  criterionValueList: Array<string> = [];
  subOptions: any;
  subCriterionNameList: Array<any> = [];
  subCriterionOperatorList: Array<any> = [];
  subCriterionValueList: Array<string> = [];
  mainCriterion: any = {
    name: "",
    op: "",
    value: ""
  };
  customCriterion: any = {
    name: "",
    op: "",
    value: ""
  };
  subCriterion: Array<AdmRuleSubCriterion>;
  parseDivideStyle: Function = parseDivideStyle;
  SEPARATOR_KEYS_CODES: number[] = [ENTER, COMMA];
  CRITERIA_PATTERN = GlobalConstant.CRITERIA_PATTERN;
  pspCriteria: string = "";
  pssCollections: any;
  hasPSP: boolean = false;
  isPSSBaseline: boolean = false;
  isPSSRestricted: boolean = false;
  isMainView: boolean = true;
  @ViewChild(JsonEditorComponent, { static: false }) editor: JsonEditorComponent;
  jsonEditorOptions: JsonEditorOptions;
  podTemplateData: any;
  podTemplateTreeData: any;
  nodeValueType: string = '';
  customizedOps: Array<string> = [];
  customizedValues: Array<string> = [];
  jsonEditorPrevBtnEl: HTMLElement;
  jsonEditorNextBtnEl: HTMLElement;
  sigVerifierOptions: string[] =[];
  valuechips: string[] = [];
  valuechipsModel: any;
  @ViewChild('valueChipsInput') valueChipsInput: ElementRef<HTMLInputElement>;

  UNITS = {
    publishDays: ["Day(s)"],
    cpuLimit: ["Core(s)"],
    cpuRequest: ["Core(s)"],
    memoryLimit: ["kB", "MB", "GB"],
    memoryRequest: ["kB", "MB", "GB"]
  }
  hasMultiValue: boolean = false;
  submittingUpdate: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddEditAdmissionRuleModalComponent>,
    public admissionRulesService: AdmissionRulesService,
    private bytesPipe: BytesPipe,
    private translate: TranslateService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.jsonEditorOptions = new JsonEditorOptions();
  }

  ngOnInit(): void {
    this.modalOp = GlobalConstant.MODAL_OP;
    this.addEditAdmissionRuleForm = new FormGroup({
      id: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? 0 : this.data.rule4Edit.id),
      category: new FormControl(GlobalConstant.ADMISSION.CATEGORY.KUBE),
      isException: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? false : this.data.rule4Edit.rule_type === "exception"),
      comment: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? "" : this.data.rule4Edit.comment),
      criteria: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? [] : this.data.rule4Edit.criteria, Validators.required),
      enabled: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? true : !this.data.rule4Edit.disable),
      cfg_type: new FormControl(this.data.cfgType === GlobalConstant.SCOPE.FED ? GlobalConstant.CFG_TYPE.FED : GlobalConstant.CFG_TYPE.CUSTOMER),
      rule_type: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? "deny" : this.data.rule4Edit.rule_type),
      rule_mode: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? "" : this.data.rule4Edit.rule_mode),
      disable: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? false : this.data.rule4Edit.disable)
    });
    this.getCriteriaOptions();
    if (this.data.opType !== GlobalConstant.MODAL_OP.ADD) {
      let criteria = JSON.parse(JSON.stringify(this.addEditAdmissionRuleForm.controls.criteria.value));
      this.addEditAdmissionRuleForm.controls.criteria.setValue([]);
      this.renderCriteriaTag(criteria);
    }
    this.addEditAdmissionRuleForm.get("criteria")!.valueChanges.subscribe(criteria => {
      this.hasPSP = criteria.some(criterion => {
        if (criterion.value) {
          return criterion.value.name.toLowerCase() === GlobalConstant.PSP;
        } else {
          return false;
        }
      });
      this.isPSSBaseline = criteria.some(criterion => {
        if (criterion.value) {
          return criterion.value.name.toLowerCase() === GlobalConstant.PSS && criterion.value.value === 'baseline';
        } else {
          return false;
        }
      });
      this.isPSSRestricted = criteria.some(criterion => {
        if (criterion.value) {
          return criterion.value.name.toLowerCase() === GlobalConstant.PSS && criterion.value.value === 'restricted';
        } else {
          return false;
        }
      });
    });
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  onSubmit = () => {
    this.dialogRef.close(true);
  }

  clearCriterionDetail = (selectedCriterionName?: string | undefined) => {
    this.mainCriterion = {
      name: selectedCriterionName || "",
      op: "",
      value: ""
    };
    this.criterionValueList = [];
    this.hasMultiValue = false;
    this.subCriterion = [];
  };

  toggleType = () => {
    this.clearCriterionDetail();
    this.getCriteriaOptions();
    this.addEditAdmissionRuleForm.controls.criteria.setValue([]);
  };

  changeCriterionName = (selectedCriterionName, needClear = false) => {
    this.initCriteriaOptionsView(this.criteriaOptions, selectedCriterionName);
    this.mainCriterion.op = this.criterionOperatorList[0];
    this.mainCriterion.value_type = '';
    // if (needClear) this.clearCriterionDetail(selectedCriterionName);
  };

  changeCriterionOperator = (selectedCriterionOperator) => {
    let isPredefined = this.criteriaOptions[this.mainCriterion.name];
    this.hasMultiValue = selectedCriterionOperator.toLowerCase().includes("contain") && isPredefined;
  };

  onAutoCompleteListOpened = () => {
    this.sigVerifierOptions = this.data.admissionOptions.admission_options.sigstore_verifiers.filter(option => !this.valuechips.includes(option));
  };

  onValueAutocompleteSelected = (event: MatAutocompleteSelectedEvent) => {
    this.valuechips.push(event.option.viewValue);
    this.mainCriterion.value = this.valuechips.join(',');
    this.valueChipsInput.nativeElement.value = '';
  };

  removeValueChip = (valueChip: string) => {
    const index = this.valuechips.indexOf(valueChip);
    if (index >= 0) {
      this.valuechips.splice(index, 1);
    }
  };

  switchCustomizedCriterionView = () => {
    this.isMainView = false;
    this.initCustomizedCriterionView();
    this.mainCriterion.op = '';
    this.mainCriterion.value = '';

    setTimeout(() => {
      let jsonEditorNavEl = document.getElementsByClassName('jsoneditor-navigation-bar')[0] as HTMLElement;
      let jsonEditorContentInnerEl = document.getElementsByClassName('jsoneditor-tree-inner')[0] as HTMLElement;
      this.jsonEditorPrevBtnEl = document.getElementsByClassName('jsoneditor-next')[0] as HTMLElement;
      this.jsonEditorNextBtnEl = document.getElementsByClassName('jsoneditor-previous')[0] as HTMLElement;

      jsonEditorNavEl.style.height = "0";
      jsonEditorContentInnerEl.style.height = "410px";
      jsonEditorContentInnerEl.style.overflowY = "scroll";

      this.jsonEditorPrevBtnEl.addEventListener('click', this.searchMove);
      this.jsonEditorNextBtnEl.addEventListener('click', this.searchMove);
    });
  };

  onCustomizedViewCancel = () => {
    this.clearCustomizedCriterion();
    this.isMainView = true;
    this.destoryListeners();
  };

  isCustomCriterionValid = (customCriterion) => {
    if (
      this.customizedValues.length < 1 &&
      !this.customCriterion.op.toLowerCase().includes('exist'.toLowerCase()) &&
      this.nodeValueType !== 'key' &&
      this.nodeValueType
    )
    {
      return !!customCriterion.name && !!customCriterion.op && !!customCriterion.value;
    } else {
      return !!customCriterion.name && !!customCriterion.op;
    }
  };

  addCustomizedCriteria = (customCriterion) => {
    this.addCriterionIntoChip(customCriterion);
    this.isMainView = true;
    this.destoryListeners();
  };

  clickEditor = (event) => {
    let treepathEl = document.getElementsByClassName('jsoneditor-treepath')[0];
    this.nodeValueType = '';
    console.log(Array.from(treepathEl.children).map(child => child.innerHTML).filter(pathNode => pathNode !== '►').join('.'));
    this.customCriterion.name =
      Array.from(treepathEl.children)
      .map(child => child.innerHTML === 'object' ? 'item' : child.innerHTML)
      .filter(pathNode => pathNode !== '►' && pathNode !== '...')
      .join('.');
    if (Array.from(event.target.classList).includes('jsoneditor-value')) {
      this.nodeValueType = getValueType4Text(event.target.innerHTML);
    } else if (Array.from(event.target.classList).includes('jsoneditor-field')) {
      this.nodeValueType = 'key';
    }
    this.generateOperatorValueList(this.nodeValueType);
    this.customCriterion.op = '';
    this.customCriterion.value = '';
  };

  changeCustomizedCriterionOperator = (operator) => {
    this.customCriterion.value = '';
  };

  shareCheckedList = (items: any[]) => {
    this.mainCriterion.value = items.join(',');
  }

  renderCriteriaTag = (criteria) => {
    if (criteria && Array.isArray(criteria)) {
      criteria.forEach(criterion => {
        if (criterion.type === 'saBindRiskyRole') {
          criterion.name = criterion.type;
        }
        this.addCriterionIntoChip(criterion);
      });
    }
  };

  isInvalidCriterion = (mainCriterion, subCriterion) => {
    let isReadonly = this.data.opType !== this.modalOp.VIEW;
    let isValidInput = false;
    if (GlobalConstant.CRITERIA_PATTERN.NAME_ONLY.includes(mainCriterion.name)) {
      isValidInput = true;
    } else if (GlobalConstant.CRITERIA_PATTERN.RESOURCE.includes(mainCriterion.name)) {
      isValidInput = mainCriterion.name !== '' && subCriterion.some(item => item.op && item.value);
    } else {
      isValidInput = mainCriterion.name !== '' && mainCriterion.op !== '' && mainCriterion.value !== '';
    }
    return isReadonly && !isValidInput;
  };

  addCriterionIntoChip4HTML = (mainCriterion, subCriterion) => {
    this.addCriterionIntoChip({
      name: mainCriterion.name,
      op: mainCriterion.op,
      value: mainCriterion.value,
      value_type: mainCriterion.value_type,
      sub_criteria: subCriterion
    });
  };

  addCriterionIntoChip = (criterion) => {
    let isCustomized = !this.criteriaOptions[criterion.name];
    let tag = this.admissionRulesService.parseTag(this.CRITERIA_PATTERN, criterion, isCustomized);
    this.addEditAdmissionRuleForm.controls.criteria.setValue(
      this.admissionRulesService.checkAndAppendCriteria(tag.tagName, criterion, this.addEditAdmissionRuleForm.controls.criteria, isCustomized, this.nodeValueType)
    );
    if (isCustomized) {
      this.clearCustomizedCriterion();
    } else {
      this.clearCriterionDetail();
    }
  };

  removeCriterionFromChip = (criterion) => {
    this.addEditAdmissionRuleForm.controls.criteria.setValue(
      this.admissionRulesService.removeCriterionFromChip(criterion, this.addEditAdmissionRuleForm.controls.criteria)
    );
    this.clearCriterionDetail();
    if (!this.getCriterionNameList(this.criteriaOptions).includes(criterion.value.name)) {
      this.removeUnexistingCriterionName(criterion.value.name);
    }
  };

  criterionSelectedInChip = (criterion) => {
    this.clearCriterionDetail();
    [
      this.mainCriterion,
      this.subCriterion
    ] = this.admissionRulesService.criterionSelectedInChip(criterion);
    if (this.criteriaOptions[this.mainCriterion.name]) {
      this.criterionOperatorList = this.getCriterionOperatorList(this.criteriaOptions, this.mainCriterion.name);
      if (this.mainCriterion.op) this.changeCriterionOperator(this.mainCriterion.op);
      this.criterionValueList = this.getCriterionValueList(this.criteriaOptions, this.mainCriterion.name);
      if (criterion.value.name === 'saBindRiskyRole') {
        this.criterionValueList = this.data.admissionOptions.predefined_risky_roles.map(role => {
          return {
            name: this.translate.instant(`admissionControl.values.${role.toUpperCase()}`),
            value: role,
            checked: criterion.value.value.includes(role)
          }
        })
      }
      if (this.mainCriterion.name === 'imageVerifiers') {
        this.valuechips = this.mainCriterion.value.split(',');
        this.sigVerifierOptions = this.data.admissionOptions.admission_options.sigstore_verifiers;
      }
      this.subOptions = this.getSubOptions(this.criteriaOptions, this.mainCriterion.name);
      if (this.subOptions) {
        this.initCriteriaSubOptionsView(this.subOptions, this.subCriterion);
      }
    } else {
      let valueType = getValueType4Text(this.mainCriterion.name);
      let criterionNameListSet = new Set(this.criterionNameList);
      criterionNameListSet.add(this.mainCriterion.path);
      this.criterionNameList = Array.from(criterionNameListSet);
      this.mainCriterion.name = this.mainCriterion.path;
      this.criterionOperatorList = [this.mainCriterion.op];
      this.criterionValueList = [this.mainCriterion.name];
      this.subOptions = null;
    }

  };

  updateRule = () => {
    let adminRule = this.addEditAdmissionRuleForm.value;
    adminRule.criteria = adminRule.criteria.map(criterion => {
      if (criterion.value.sub_criteria && Array.isArray(criterion.value.sub_criteria) && criterion.value.sub_criteria.length === 0) {
        delete criterion.value.sub_criteria;
      }
      if (!this.criteriaOptions[criterion.value.name]) { //For customized criterion
        criterion.value.type = GlobalConstant.ADMISSION.CRITERION_TYPE.CUSTOM_PATH;
        criterion.value.template_kind = this.data.opType === GlobalConstant.MODAL_OP.ADD ? this.podTemplateData.kind : criterion.value.template_kind;
        criterion.value.name = '';
      }
      if (criterion.value.name === 'saBindRiskyRole') { // For Service account bound risky role
        criterion.value.type = 'saBindRiskyRole',
        criterion.value.name = '';
        criterion.value.path = '';
      }
      return criterion.value;
    });

    adminRule.rule_type = adminRule.isException ? "exception" : "deny";
    adminRule.disable = !adminRule.enabled;
    if (adminRule.isException) delete adminRule.rule_mode;

    this.admissionRulesService.addUpdateAdmissionRules({config: adminRule}, this.data.opType)
      .subscribe(
        response => {
          let msgTitle = this.data.opType === GlobalConstant.MODAL_OP.ADD ?
            this.translate.instant("admissionControl.msg.INSERT_OK") :
            `${this.translate.instant("admissionControl.msg.UPDATE_OK")} - ID: ${adminRule.id}`;
          this.notificationService.open(msgTitle);
          this.onSubmit();
          if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
            setTimeout(() => {
              this.data.refresh();
            }, 1000);
          } else {
            updateGridData(
              this.data.admissionRules,
              [adminRule],
              this.data.gridApi,
              'id',
              'edit'
            );
          }
        },
        error => {
          let msgTitle = this.data.opType === GlobalConstant.MODAL_OP.ADD ?
            this.translate.instant("admissionControl.msg.INSERT_NG") :
            this.translate.instant("admissionControl.msg.UPDATE_NG");
          this.notificationService.openError(error, msgTitle);
        }
      )
  };

  private getCriteriaOptions =() => {
    this.criteriaOptions = this.addEditAdmissionRuleForm.controls.isException.value ?
      this.data.admissionOptions.admission_options.exception_options.k8s_options.rule_options :
      this.data.admissionOptions.admission_options.deny_options.k8s_options.rule_options;
    if (!this.addEditAdmissionRuleForm.controls.isException.value) {
      this.criteriaOptions.saBindRiskyRole.value =
        this.data.admissionOptions.predefined_risky_roles.map(role => {
          return {
            name: this.translate.instant(`admissionControl.values.${role.toUpperCase()}`),
            value: role,
            checked: false
          }
        });
    }
    this.sigVerifierOptions = this.data.admissionOptions.admission_options.sigstore_verifiers;
    delete this.criteriaOptions.customPath;
    this.pspCriteria = `${this.translate.instant("admissionControl.PSP_CRITERIA")} ${this.data.admissionOptions.admission_options.psp_collection.map(pspCriterion => {
        return this.translate.instant(`admissionControl.names.${parseDivideStyle(pspCriterion.name).toUpperCase()}`);
      }).join(", ")}`;
    this.pssCollections = this.data.admissionOptions.admission_options.pss_collections;
    this.initCriteriaOptionsView(this.criteriaOptions);
    this.clearCriterionDetail();
  };

  private getSubOptions = (criteriaOptions: any, selectedCriterionName: string) => {
    return criteriaOptions[selectedCriterionName].sub_options || null;
  };

  private getCriterionNameList = (criteriaOptions: any) => {
    return Object.keys(criteriaOptions);
  };

  private getCriterionOperatorList = (criteriaOptions: any, selectedCriterionName: string) => {
    return criteriaOptions[selectedCriterionName].ops;
  };

  private getCriterionValueList = (criteriaOptions: any, selectedCriterionName: string) => {
    return criteriaOptions[selectedCriterionName].values || [];
  };

  private getSubNameList = (subOptions: any) => {
    return Object.keys(subOptions);
  };

  private initCriteriaOptionsView = (criteriaOptions: any, selectedCriterionName?: string | undefined) => {
    this.criterionNameList = this.getCriterionNameList(this.criteriaOptions);
    this.criterionOperatorList = this.getCriterionOperatorList(this.criteriaOptions, selectedCriterionName || this.criterionNameList[0]);
    this.criterionValueList = this.getCriterionValueList(this.criteriaOptions, selectedCriterionName || this.criterionNameList[0]);
    if (selectedCriterionName === 'saBindRiskyRole') {
      this.criterionValueList = this.data.admissionOptions.predefined_risky_roles.map(role => {
        return {
          name: this.translate.instant(`admissionControl.values.${role.toUpperCase()}`),
          value: role,
          checked: false
        }
      })
    }
    if (this.criterionValueList.length === 0) this.mainCriterion.value = '';
    if (this.criterionOperatorList.length > 0)
      this.changeCriterionOperator(this.criterionOperatorList[0]);
    this.subOptions = this.getSubOptions(this.criteriaOptions, selectedCriterionName || this.criterionNameList[0]);
    if (this.subOptions) {
      this.initCriteriaSubOptionsView(this.subOptions);
    }
  };

  private initCriteriaUnit = (i) => {
    if (
      this.UNITS[this.subCriterion[i].name] &&
      Array.isArray(this.UNITS[this.subCriterion[i].name]) &&
      this.UNITS[this.subCriterion[i].name].length > 0
    ) {
      this.subCriterion[i].unit = this.UNITS[this.subCriterion[i].name][0];
    }
  };

  private fillSubCriterion = (subCriterionData: Array<AdmRuleSubCriterion>): void => {
    let dataIndex = 0;
    this.subCriterion = this.subCriterion.map((elem) => {
      if (Array.isArray(subCriterionData) && subCriterionData.length > 0 && subCriterionData[dataIndex] && elem.name === subCriterionData[dataIndex].name) {
        let valueStr = "";
        elem.op = subCriterionData[dataIndex].op;
        if (elem.name.toLowerCase().includes("memory")) {
          let valueStrArray = this.bytesPipe.transform(subCriterionData[dataIndex].value.toString(), 2).split(" ");
          elem.value = valueStrArray[0];
          elem.unit = valueStrArray[1];
        } else {
          elem.value = subCriterionData[dataIndex].value;
        }
        dataIndex++;
      }
      return elem;
    });
  };

  private initCriteriaSubOptionsView = (criteriaOptions: any, subCriterionData?: Array<AdmRuleSubCriterion> | undefined) => {
    this.subCriterionNameList = this.getCriterionNameList(criteriaOptions);
    this.subOptions = Object.values(criteriaOptions);
    this.subCriterion = new Array<AdmRuleSubCriterion>(this.subOptions.length);
    for (let i = 0; i < this.subOptions.length; i++){
      this.subCriterion[i] = new AdmRuleSubCriterion();
      this.subCriterion[i].name = this.subOptions[i].name;
      if (this.subOptions[i].ops?.length === 1) {
        this.subCriterion[i].op = this.subOptions[i].ops[0];
      }
      this.initCriteriaUnit(i);
    }
    if (subCriterionData) {
      this.fillSubCriterion(subCriterionData);
    }
  };

  private clearCustomizedCriterion = () => {
    this.customCriterion = {
      name: "",
      op: "",
      value: ""
    };
  };

  private removeUnexistingCriterionName = (criterionName) => {
    this.criterionNameList = this.criterionNameList.filter(_criterionName => _criterionName !== criterionName);
  };

  private initCustomizedCriterionView = () => {
    this.jsonEditorOptions.mode = 'view';
    this.jsonEditorOptions.expandAll = true;
    this.podTemplateData = this.data.admissionOptions.admission_custom_criteria_templates[0];
    this.podTemplateTreeData = JSON.parse(this.podTemplateData.rawjson);
  };

  private generateOperatorValueList = (valueType) => {
    let optionsByValuetype = groupBy(this.data.admissionOptions.admission_custom_criteria_options, 'valuetype');
    console.log(optionsByValuetype);
    this.customizedValues = optionsByValuetype[valueType] ? optionsByValuetype[valueType][0].values || [] : [];
    this.customizedOps = optionsByValuetype[valueType] ? optionsByValuetype[valueType][0].ops || [] : [];
  };

  private searchMove = () => {
    let prevHighlightedWordElArray = document.querySelectorAll('[tabindex="0"]');
    prevHighlightedWordElArray.forEach(el => el.removeAttribute('tabindex'));
    let jsonEditorHighlightedWordEl = document.getElementsByClassName('jsoneditor-highlight-active jsoneditor-highlight')[0] as HTMLElement;
    jsonEditorHighlightedWordEl.setAttribute('tabindex', '0');
    setTimeout(() => {
      jsonEditorHighlightedWordEl.focus();
    });
  };

  private destoryListeners = () => {
    this.jsonEditorPrevBtnEl.removeEventListener('click', this.searchMove);
    this.jsonEditorNextBtnEl.removeEventListener('click', this.searchMove);
  };
}
