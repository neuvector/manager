import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, Output, EventEmitter } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-confirm-dialog-response-rule',
  templateUrl: './confirm-dialog-response-rule.component.html',
  styleUrls: ['./confirm-dialog-response-rule.component.scss'],
})
export class ConfirmDialogResponseRuleComponent {
  loading: boolean = false;
  isUnquarantined: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogResponseRuleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  @Output() confirm = new EventEmitter();
  onConfirm(): void {
    this.loading = true;
    if (this.data.isSync) {
      this.dialogRef.close(true);
    } else {
      this.confirm.emit();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
