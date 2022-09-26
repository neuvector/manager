import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslatorService } from '@core/translator/translator.service';
import { AdmissionRulesService } from "@common/services/admission-rules.service";
import { UtilsService } from "@common/utils/app.utils";
import { finalize } from 'rxjs/operators';
import { saveAs } from 'file-saver';


@Component({
  selector: 'app-export-admission-rules-modal',
  templateUrl: './export-admission-rules-modal.component.html',
  styleUrls: ['./export-admission-rules-modal.component.scss'],
})
export class ExportAdmissionRulesModalComponent implements OnInit {

  submittingForm = false;
  exportForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ExportAdmissionRulesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private admissionRulesService: AdmissionRulesService,
    private utils: UtilsService
  ) { }

  ngOnInit(): void {
    this.exportForm = new FormGroup({
      isIncludingConfig: new FormControl(false)
    });
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  submitExport = () => {
    this.submittingForm = true;
    this.admissionRulesService
      .exportAdmissionRules(this.data.selectedAdmissionRules, this.exportForm.controls.isIncludingConfig.value)
      .pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      )
      .subscribe(
        response => {
          let filename = this.utils.getExportedFileName(response);
          let blob = new Blob([response.body || ""], {
            type: "text/plain;charset=utf-8"
          });
          saveAs(blob, filename);
        },
        error => {}
      );
  };

}
