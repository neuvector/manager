import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone: false,
  selector: 'app-import-file-modal',
  templateUrl: './import-file-modal.component.html',
  styleUrls: ['./import-file-modal.component.scss'],
})
export class ImportFileModalComponent {
  //Pass "importUrl" through "data" when open the modal component.

  /* Sample:
    this.dialog.open(ImportFileModalComponent, {
     data: {
       importUrl: PathConstant.IMPORT_ADM_CTRL,
       importMsg: {
         success: 'Import successful',
         error: 'Import failed',
       }
     },
     
   });
  */
  constructor(
    public dialogRef: MatDialogRef<ImportFileModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel() {
    this.dialogRef.close();
  }
}
