import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GlobalVariable } from '@common/variables/global.variable';
import { SafeHtml } from "@angular/platform-browser";

@Component({
  selector: 'app-agreement',
  templateUrl: './agreement.component.html',
  styleUrls: ['./agreement.component.scss'],
})
export class AgreementComponent implements OnInit {
  isFromSSO: boolean = false;

  eulaPolicy: SafeHtml = '';

  constructor(
    private dialogRef: MatDialogRef<AgreementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.isFromSSO = this.data.isFromSSO;
    this.eulaPolicy = GlobalVariable.customEULAPolicy;
  }

  onClose() {
    this.dialogRef.close();
  }
}
