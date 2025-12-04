import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';
import { AdmissionRulesService } from '@common/services/admission-rules.service';
import { GridOptions } from 'ag-grid-community';
import {
  AdmissionConfigurationAssessment,
  AdmissionTestResult,
} from '@common/types/admission/admission';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';


@Component({
  standalone: false,
  selector: 'app-configuration-assessment-modal',
  templateUrl: './configuration-assessment-modal.component.html',
  styleUrls: ['./configuration-assessment-modal.component.scss'],
  
})
export class ConfigurationAssessmentModalComponent implements OnInit {
  importUrl: string = '';
  gridOptions: GridOptions = <GridOptions>{};
  gridHeight: number = 0;
  configAssessmentResult!: AdmissionConfigurationAssessment;
  admissionTestResults: Array<AdmissionTestResult>;
  MapConstant = MapConstant;

  constructor(
    public dialogRef: MatDialogRef<ConfigurationAssessmentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private admissionRulesService: AdmissionRulesService,
    public utils: UtilsService,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.importUrl = PathConstant.ADMISSION_TEST_URL;
    this.gridOptions = this.admissionRulesService.configMatchingTestGrid();
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  getImportResult = (response: AdmissionConfigurationAssessment) => {
    this.configAssessmentResult = response;
    this.configAssessmentResult.results =
      this.configAssessmentResult.results.map(result => {
        if (result.matched_rules) {
          result.matched_rules = result.matched_rules.map(rule => {
            if (
              !rule.mode &&
              rule.type !== GlobalConstant.ADMISSION.RULE_TYPE.EXCEPTION
            )
              rule.mode = this.admissionRulesService.globalMode;
            if (
              rule.mode === GlobalConstant.MODE.MONITOR &&
              rule.type !== GlobalConstant.ADMISSION.RULE_TYPE.EXCEPTION
            )
              rule.type = '';
            return rule;
          });
        }
        return result;
      });
    this.admissionTestResults =
      this.admissionRulesService.formatAdmissionTestResults(
        this.configAssessmentResult.results
      );
  };

  exportCsv = () => {
    if (this.configAssessmentResult) {
      let csv = arrayToCsv(
        this.getConfigAssessmentResultRows(this.configAssessmentResult.results),
        this.translate.instant(
          'admissionControl.matchingTestGrid.UNAVAILABLE_PROP',
          {
            propsUnavailable:
              this.configAssessmentResult.props_unavailable.join('，'),
          }
        )
      );
      let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(
        blob,
        `${this.translate.instant(
          'admissionControl.matchingTestGrid.REPORT_TITLE'
        )}_${this.utils.parseDatetimeStr(new Date())}.csv`
      );
    }
  };

  exportPdf = () => {
    this.data.printConfigurationAssessmentResultFn({
      data: this.configAssessmentResult.results,
      instruction: {
        title: this.translate.instant(
          'admissionControl.matchingTestGrid.UNAVAILABLE_PROP',
          {
            propsUnavailable:
              this.configAssessmentResult.props_unavailable.join(', '),
          }
        ),
      },
    });
  };

  private getConfigAssessmentResultRows = configAssessmentResults => {
    let rows: Array<any> = [];
    configAssessmentResults.forEach(row => {
      if (
        row.matched_rules &&
        Array.isArray(row.matched_rules) &&
        row.matched_rules.length > 0
      ) {
        row.matched_rules.forEach((matched_rule, index) => {
          rows.push({
            Resource: index === 0 ? row.index : '',
            Kind: index === 0 ? row.kind : '',
            Name: index === 0 ? row.name : '',
            Message: index === 0 ? row.message : '',
            'ID (Matched Rule)': matched_rule.id,
            'Description (Matched Rule)': matched_rule.rule_details,
            'Container Image': matched_rule.container_image,
            'Mode (Matched Rule)': matched_rule.mode,
            Disabled: matched_rule.disabled,
            'Action (Matched Rule)': matched_rule.type,
            'Type (Matched Rule)': matched_rule.rule_cfg_type,
          });
        });
      } else {
        rows.push({
          Resource: row.index,
          Kind: row.kind,
          Name: row.name,
          Message: row.message,
          'ID (Matched Rule)': '',
          'Description (Matched Rule)': '',
          'Container Image': '',
          'Mode (Matched Rule)': '',
          Disabled: '',
          'Action (Matched Rule)': '',
          'Type (Matched Rule)': '',
        });
      }
    });
    return rows;
  };
}
