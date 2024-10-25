import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FileAccessRulesService } from '@services/file-access-rules.service';
import { GridOptions } from 'ag-grid-community';
import { GlobalConstant } from '@common/constants/global.constant';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-predefined-file-access-rules-modal',
  templateUrl: './predefined-file-access-rules-modal.component.html',
  styleUrls: ['./predefined-file-access-rules-modal.component.scss'],
})
export class PredefinedFileAccessRulesModalComponent implements OnInit {
  public gridOptions4PredefinedFileAccessRules: GridOptions;
  public predefinedFileAccessRules: [];
  public gridHeight: number = 300;
  constructor(
    public dialogRef: MatDialogRef<PredefinedFileAccessRulesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private utils: UtilsService,
    private fileAccessRulesService: FileAccessRulesService,
    private translate: TranslateService
  ) {}
  context;
  ngOnInit(): void {
    this.initializeVM();
    this.context = { componentParent: this };
  }

  onCancel() {
    this.dialogRef.close();
  }

  initializeVM() {
    this.gridOptions4PredefinedFileAccessRules =
      this.fileAccessRulesService.prepareGrid(
        false,
        this.data.source
      ).gridOptions4PredefinedFileAccessRules;
    this.getPredefinedFileAccessRules();
  }

  getPredefinedFileAccessRules() {
    this.fileAccessRulesService
      .getPredefinedFileAccessRulesData(this.data.groupName)
      .subscribe(
        response => {
          this.predefinedFileAccessRules = response['profile']['filters'];
        },
        err => {
          console.warn(err);
          if (err.status !== GlobalConstant.STATUS_NOT_FOUND) {
            let errMsg = this.utils.getErrorMessage(err);
            this.gridOptions4PredefinedFileAccessRules.overlayNoRowsTemplate =
              '<div class="server-error">' +
              '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
              '<div><span class="error-text">' +
              errMsg +
              '</span></div></div>';
          }
        }
      );
  }
}
