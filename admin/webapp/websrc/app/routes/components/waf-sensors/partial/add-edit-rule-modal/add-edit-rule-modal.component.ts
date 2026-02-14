import { Component, OnInit, Inject } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WafSensorsService } from '@services/waf-sensors.service';
import { TranslateService } from '@ngx-translate/core';
import { WafPattern } from '@common/types';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { GlobalVariable } from '@common/variables/global.variable';
import * as $ from 'jquery';

@Component({
  standalone: false,
  selector: 'app-add-edit-rule-modal',
  templateUrl: './add-edit-rule-modal.component.html',
  styleUrls: ['./add-edit-rule-modal.component.scss'],
})
export class AddEditRuleModalComponent implements OnInit {
  opTypeOptions = GlobalConstant.MODAL_OP;
  addEditRuleForm: FormGroup;
  submittingUpdate: boolean = false;
  operators: Array<any>;
  contexts: Array<any>;
  pattern: WafPattern;
  patterns: Array<WafPattern>;
  isShowingTestPattern: boolean = false;
  testCase: string;
  testResult: string;
  isMatched: boolean;
  context = { componentParent: this };
  gridOptions4EditPatterns: GridOptions;
  gridApi4EditPatterns!: GridApi;
  patternErrorMsg: string = '';

  constructor(
    private dialogRef: MatDialogRef<AddEditRuleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private wafSensorsService: WafSensorsService,
    private translate: TranslateService,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.operators = [
      {
        value: 'regex',
        viewValue: this.translate.instant('waf.patternGrid.REGEX'),
      },
      {
        value: '!regex',
        viewValue: this.translate.instant('waf.patternGrid.!REGEX'),
      },
    ];
    this.contexts = ['packet', 'url', 'header', 'body'];

    this.initializePattern();

    if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
      this.addEditRuleForm = new FormGroup({
        sensorName: new FormControl(this.data.sensor.name, Validators.required),
        comment: new FormControl(this.data.sensor.comment),
        ruleName: new FormControl('', Validators.required),
      });
      this.patterns = [];
    } else {
      this.addEditRuleForm = new FormGroup({
        sensorName: new FormControl(this.data.sensor.name, Validators.required),
        comment: new FormControl(this.data.sensor.comment),
        ruleName: new FormControl(this.data.rule.name, Validators.required),
      });
      this.patterns = JSON.parse(JSON.stringify(this.data.rule.patterns));
    }
    let isWriteWAFSensorAuthorized =
      this.authUtilsService.getDisplayFlag('write_waf_rule') &&
      !this.authUtilsService.userPermission.isNamespaceUser;
    let gridOptions = this.wafSensorsService.configGrids(
      isWriteWAFSensorAuthorized
    );
    this.gridOptions4EditPatterns = gridOptions.gridOptions4EditPatterns;
    this.gridOptions4EditPatterns.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi4EditPatterns = params.api;
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
    this.gridOptions4EditPatterns.onSelectionChanged = this.onPatternChanged;
    setTimeout(() => {
      this.gridApi4EditPatterns!.setGridOption('rowData', this.patterns);
    }, 200);
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  initTestArea = pattern => {
    this.testCase = '';
    this.testRegex(pattern, '');
  };

  addPattern = () => {
    if (this.patterns.length >= 16) {
      this.patternErrorMsg = this.translate.instant('waf.msg.ADD_PATTERN_NG');
    } else {
      let indexOfExistingPattern = this.patterns.findIndex(pattern => {
        return (
          pattern.value === this.pattern.value && pattern.op === this.pattern.op
        );
      });
      if (this.checkReciprocalPattern(this.patterns, this.pattern)) {
        this.patternErrorMsg = this.translate.instant(
          'waf.msg.RECIPROCAL_PATTERN_NG'
        );
      } else {
        if (indexOfExistingPattern === -1) {
          this.patterns.push(this.pattern);
        } else {
          this.patterns.splice(indexOfExistingPattern, 1, this.pattern);
        }
        this.gridApi4EditPatterns!.setGridOption('rowData', this.patterns);
        this.patternErrorMsg = '';
        this.initializePattern();
      }
    }
  };

  updateRule = () => {
    if (this.data.opType === GlobalConstant.MODAL_OP.ADD) {
      this.data.sensor.rules.push({
        name: this.addEditRuleForm.controls.ruleName.value,
        patterns: this.patterns,
        cfg_type: this.data.cfgType,
      });
    } else {
      this.data.sensor.rules.splice(this.data.index, 1, {
        id: this.data.rule.id,
        name: this.data.rule.name,
        patterns: this.patterns,
      });
    }
    let payload = {
      config: {
        name: this.data.sensor.name,
        comment: this.data.sensor.comment,
        rules: this.data.sensor.rules,
      },
    };

    console.log('this.data.index4Sensor', this.data.index4Sensor);

    this.wafSensorsService
      .updateWafSensorData(payload, GlobalConstant.MODAL_OP.EDIT)
      .subscribe(
        response => {
          this.notificationService.open(
            this.translate.instant('waf.msg.UPDATE_RULE_OK')
          );
          this.data.gridApi.setGridOption('rowData', payload.config.rules);
          setTimeout(() => {
            let rowNode = this.data.gridApi.getDisplayedRowAtIndex(
              this.data.index
            );
            rowNode?.setSelected(true);
          }, 200);
          this.dialogRef.close(true);
        },
        error => {
          if (this.data.opType === GlobalConstant.MODAL_OP.ADD)
            this.data.sensor.rules.pop();
          if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
            this.notificationService.open(
              this.utils.getAlertifyMsg(
                error.error,
                this.translate.instant('waf.msg.UPDATE_RULE_NG'),
                false
              ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        }
      );
  };

  testRegex = (pattern, testCase) => {
    if (!pattern) return;
    if (!testCase) {
      this.testResult = '';
      this.isMatched = true;
      return;
    }
    this.isMatched = RegExp(`^${pattern}`, 'g').test(testCase);
    if (this.isMatched && testCase.length > 0) {
      this.testResult = this.translate.instant('waf.msg.MATCH');
    }
    if (!this.isMatched && testCase.length > 0) {
      this.testResult = this.translate.instant('waf.msg.MISMATCH');
    }
  };

  private initializePattern = () => {
    this.pattern = {
      key: 'pattern',
      op: this.operators[0].value,
      value: '',
      context: this.contexts[0],
    };
  };

  private onPatternChanged = () => {
    this.pattern = this.gridApi4EditPatterns!.getSelectedRows()[0];
  };

  private checkReciprocalPattern = (patternList, currPattern) => {
    return (
      patternList.findIndex(pattern => {
        return (
          pattern.value === currPattern.value &&
          pattern.op !== currPattern.op &&
          pattern.context === currPattern.context
        );
      }) > -1
    );
  };
}
