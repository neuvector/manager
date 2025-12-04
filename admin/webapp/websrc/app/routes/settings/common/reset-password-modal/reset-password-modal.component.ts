import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PublicPasswordProfile } from '@common/types';
import { passwordValidator } from '@common/validators';
import { Subject } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-reset-password-modal',
  templateUrl: './reset-password-modal.component.html',
  styleUrls: ['./reset-password-modal.component.scss'],
})
export class ResetPasswordModalComponent {
  saving$ = new Subject();
  passwordForm = new FormGroup(
    {
      newPassword: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
    },
    { validators: passwordValidator() }
  );
  pwdProfile!: PublicPasswordProfile;
  resetError!: string;
  @Output() resetData = new EventEmitter<{
    username: string;
    password: string;
    new_password: string;
  }>();

  constructor(
    private dialogRef: MatDialogRef<ResetPasswordModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  submitReset() {
    this.resetData.emit({
      username: this.data.username,
      password: this.data.password,
      new_password: this.passwordForm.controls.newPassword.value || '',
    });
  }

  onClose() {
    this.dialogRef.close();
  }
}
