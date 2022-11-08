import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { PathConstant } from "@common/constants/path.constant";
import { MapConstant } from "@common/constants/map.constant";
import { AdmissionRulesService } from "@common/services/admission-rules.service";
import { GridOptions } from "ag-grid-community";
import { AdmissionConfigurationAssessment } from "@common/types/admission/admission";
import { TranslateService } from "@ngx-translate/core";
import { UtilsService } from "@common/utils/app.utils";
import { arrayToCsv } from "@common/utils/common.utils";
import { saveAs } from "file-saver";

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';

@Component({
  selector: 'app-configuration-assessment-modal',
  templateUrl: './configuration-assessment-modal.component.html',
  styleUrls: ['./configuration-assessment-modal.component.scss'],
})
export class ConfigurationAssessmentModalComponent implements OnInit {

  importUrl: string ='';
  gridOptions: GridOptions = <GridOptions>{};
  gridHeight: number = 0;
  configAssessmentResult!: AdmissionConfigurationAssessment;

  constructor(
    public dialogRef: MatDialogRef<ConfigurationAssessmentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private admissionRulesService: AdmissionRulesService,
    private utils: UtilsService,
    public translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.importUrl = PathConstant.ADMISSION_TEST_URL;
    this.gridOptions = this.admissionRulesService.configMatchingTestGrid();
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  getImportResult = (response: AdmissionConfigurationAssessment) => {
    this.configAssessmentResult = response;
  };

  exportCsv = () => {
    if (this.configAssessmentResult) {
      let csv = arrayToCsv(this.configAssessmentResult.results, `${this.translate.instant("admissionControl.matchingTestGrid.UNAVAILABLE_PROP")}: ${this.configAssessmentResult.props_unavailable.join(", ")}`);
      let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      saveAs(blob, `${this.translate.instant("admissionControl.matchingTestGrid.REPORT_TITLE")}_${this.utils.parseDatetimeStr(new Date())}.csv`);
    }
  };

  exportPdf = () => {
    this.data.printConfigurationAssessmentResultFn({
      data: this.configAssessmentResult.results,
      instruction: {
        title: this.translate.instant("admissionControl.matchingTestGrid.UNAVAILABLE_PROP"),
        content: this.configAssessmentResult.props_unavailable.join(", ")
      }
    });
  };
}
