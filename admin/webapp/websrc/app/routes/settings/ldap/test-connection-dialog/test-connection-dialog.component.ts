import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LdapFormComponent } from '../ldap-form/ldap-form.component';
import { DebugPostBody, ErrorResponse, LDAP } from '@common/types';
import { finalize } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export interface TestConnectionDialogData {
  ldap: LDAP;
  name: string;
}

@Component({
  selector: 'app-test-connection-dialog',
  templateUrl: './test-connection-dialog.component.html',
  styleUrls: ['./test-connection-dialog.component.scss'],
})
export class TestConnectionDialogComponent {
  passwordVisible = false;
  submittingForm = false;
  errorMessage!: string;

  testForm = new FormGroup({
    username: new FormControl(null, Validators.required),
    password: new FormControl(null, Validators.required),
  });

  constructor(
    public dialogRef: MatDialogRef<LdapFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TestConnectionDialogData,
    private settingsService: SettingsService
  ) {}

  submitForm(): void {
    if (!this.testForm.valid) {
      return;
    }
    const body: DebugPostBody = {
      test: {
        ldap: this.data.ldap,
        name: this.data.name,
        test_ldap: this.testForm.value,
      },
    };
    this.submittingForm = true;
    this.errorMessage = '';
    this.settingsService
      .postDebug(body)
      .pipe(
        finalize(() => {
          this.submittingForm = false;
        })
      )
      .subscribe({
        error: ({ error }: { error: ErrorResponse }) => {
          if (error.error && error.message) {
            this.errorMessage = `${error.error}: ${error.message}`;
          } else {
            this.errorMessage = 'An error occurred. Please try again.';
          }
        },
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
