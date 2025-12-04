import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone: false,
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  public bootstrap_password_command: string = '';
  public k8s_rbac_alert_message: string = '';

  constructor(
    private dialogRef: MatDialogRef<AlertComponent>,
    @Inject(MAT_DIALOG_DATA) public alertData: any
  ) {}

  ngOnInit(): void {
    this.bootstrap_password_command = this.alertData.bootstrap_password_command;
    this.k8s_rbac_alert_message = this.alertData.k8s_rbac_alert_message;
  }

  onClose() {
    this.dialogRef.close();
  }
}
