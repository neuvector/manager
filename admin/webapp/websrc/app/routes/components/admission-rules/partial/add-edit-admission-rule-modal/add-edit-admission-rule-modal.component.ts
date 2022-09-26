import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { GlobalConstant } from "@common/constants/global.constant";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AdmissionRulesService } from '@common/services/admission-rules.service';
import { parseDivideStyle } from '@common/utils/common.utils';
import { AdmRuleCriterion, AdmRuleSubCriterion } from '@common/types/admission/admission';
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { BytesPipe } from "@common/pipes/app.pipes";
import { TranslateService } from '@ngx-translate/core';

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
  subCriterion: Array<AdmRuleSubCriterion>;
  parseDivideStyle: Function = parseDivideStyle;
  SEPARATOR_KEYS_CODES: number[] = [ENTER, COMMA];
  CRITERIA_PATTERN = GlobalConstant.CRITERIA_PATTERN;
  pspCriteria: string = "";
  hasPSP: boolean = false;

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
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.modalOp = GlobalConstant.MODAL_OP;
    this.addEditAdmissionRuleForm = new FormGroup({
      id: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? 0 : this.data.rule4Edit.id),
      category: new FormControl(GlobalConstant.ADMISSION.CATEGORY.KUBE),
      isException: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? false : this.data.rule4Edit.rule_type === "exception"),
      comment: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? "" : this.data.rule4Edit.comment),
      criteria: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? [] : this.data.rule4Edit.criteria),
      enabled: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? true : !this.data.rule4Edit.disable),
      cfg_type: new FormControl(this.data.cfgType === GlobalConstant.SCOPE.FED ? GlobalConstant.CFG_TYPE.FED : GlobalConstant.CFG_TYPE.CUSTOMER),
      rule_type: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? "deny" : this.data.rule4Edit.rule_type),
      disable: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? false : this.data.rule4Edit.disable)
    });
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
      })
    });
    this.getCriteriaOptions();
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
    // if (needClear) this.clearCriterionDetail(selectedCriterionName);
  };

  changeCriterionOperator = (selectedCriterionOperator) => {
    this.hasMultiValue = selectedCriterionOperator.toLowerCase().includes("contain");
  };

  renderCriteriaTag = (criteria) => {
    if (criteria && Array.isArray(criteria)) {
      criteria.forEach(criterion => {
        this.addCriterionIntoChip(criterion);
      });
    }
  };

  addCriterionIntoChip4HTML = (mainCriterion, subCriterion) => {
    this.addCriterionIntoChip({
      name: mainCriterion.name,
      op: mainCriterion.op,
      value: mainCriterion.value,
      sub_criteria: subCriterion
    });
  };

  addCriterionIntoChip = (criterion) => {
    let tag = this.admissionRulesService.parseTag(this.CRITERIA_PATTERN, criterion);
    this.addEditAdmissionRuleForm.controls.criteria.setValue(
      this.admissionRulesService.checkAndAppendCriteria(tag.tagName, criterion, this.addEditAdmissionRuleForm.controls.criteria)
    );
    this.clearCriterionDetail();
  };

  removeCriterionFromChip = (criterion) => {
    this.addEditAdmissionRuleForm.controls.criteria.setValue(
      this.admissionRulesService.removeCriterionFromChip(criterion, this.addEditAdmissionRuleForm.controls.criteria)
    );
    this.clearCriterionDetail();
  };

  criterionSelectedInChip = (criterion) => {
    this.clearCriterionDetail();
    [
      this.mainCriterion,
      this.subCriterion
    ] = this.admissionRulesService.criterionSelectedInChip(criterion);
    this.criterionOperatorList = this.getCriterionOperatorList(this.criteriaOptions, this.mainCriterion.name);
    this.changeCriterionOperator(this.mainCriterion.op);
    this.subOptions = this.getSubOptions(this.criteriaOptions, this.mainCriterion.name);
    if (this.subOptions) {
      this.initCriteriaSubOptionsView(this.subOptions, this.subCriterion);
    }
  };

  updateRule = () => {
    let adminRule = this.addEditAdmissionRuleForm.value;
    adminRule.criteria = adminRule.criteria.map(criterion => {
      if (criterion.value.sub_criteria && Array.isArray(criterion.value.sub_criteria) && criterion.value.sub_criteria.length === 0) {
        delete criterion.value.sub_criteria;
      }
      return criterion.value;
    });
    adminRule.rule_type = adminRule.isException ? "exception" : "deny";
    adminRule.disable = !adminRule.enabled;

    this.addEditAdmissionRuleForm.setValue(adminRule);
    console.log("this.addEditAdmissionRuleForm.value", this.addEditAdmissionRuleForm.value);
    this.admissionRulesService.addUpdateAdmissionRules({config: this.addEditAdmissionRuleForm.value}, this.data.opType)
      .subscribe(
        response => {
          this.onSubmit();
          setTimeout(() => {
            this.data.refresh();
          }, 1000);
        },
        error => {}
      )
  };

  private getCriteriaOptions =() => {
    this.criteriaOptions = this.addEditAdmissionRuleForm.controls.isException.value ?
      this.data.admissionOptions.exception_options.k8s_options.rule_options :
      this.data.admissionOptions.deny_options.k8s_options.rule_options;
    this.pspCriteria = `${this.translate.instant("admissionControl.PSP_CRITERIA")} ${this.data.admissionOptions.psp_collection.map(pspCriterion => {
        return this.translate.instant(`admissionControl.names.${parseDivideStyle(pspCriterion.name).toUpperCase()}`);
      }).join(", ")}`;
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
      if (elem.name === subCriterionData[dataIndex].name) {
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
}
