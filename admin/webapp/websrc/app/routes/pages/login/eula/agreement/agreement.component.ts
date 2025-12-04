import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GlobalVariable } from '@common/variables/global.variable';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Component({
  standalone: false,
  selector: 'app-agreement',
  templateUrl: './agreement.component.html',
  styleUrls: ['./agreement.component.scss'],
  
})
export class AgreementComponent implements OnInit {
  showAcceptButton: boolean = false;

  showCustomPolicy: boolean = false;
  customPolicy: SafeHtml = '';

  constructor(
    private sanitizer: DomSanitizer,
    private dialogRef: MatDialogRef<AgreementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.showAcceptButton = this.data.showAcceptButton;
    this.showCustomPolicy = this.data.showCustomPolicy;
    if (this.showCustomPolicy && GlobalVariable.customPolicy) {
      this.customPolicy = this.sanitizer.bypassSecurityTrustHtml(
        GlobalVariable.customPolicy
      );
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
