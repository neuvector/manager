import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LdapFormComponent } from '../ldap-form/ldap-form.component';
import { DebugPostBody, ErrorResponse, LDAP } from '@common/types';
import { finalize } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '@services/notification.service';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';


export interface TestConnectionDialogData {
  ldap: LDAP;
  name: string;
}

@Component({
  standalone: false,
  selector: 'app-test-connection-dialog',
  templateUrl: './test-connection-dialog.component.html',
  styleUrls: ['./test-connection-dialog.component.scss'],
  
})
export class TestConnectionDialogComponent {
  passwordVisible = false;
  submittingForm = false;
  errorMessage!: string;
  testFinished: boolean = false;
  connectedGroups: string[] = [];

  testForm = new FormGroup({
    username: new FormControl(null, Validators.required),
    password: new FormControl(null, Validators.required),
  });

  constructor(
    public dialogRef: MatDialogRef<LdapFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TestConnectionDialogData,
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private tr: TranslateService
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

    body.test.ldap.bind_password = body.test.ldap.bind_password
      ? body.test.ldap.bind_password
      : (null as any);
    this.testFinished = false;
    this.submittingForm = true;
    this.errorMessage = '';
    this.settingsService
      .postDebug(body)
      .pipe(
        finalize(() => {
          this.testFinished = true;
          this.submittingForm = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          this.notificationService.open(this.tr.instant('ldap.test.SUCCEEDED'));
          this.connectedGroups = response.result.groups;
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.errorMessage = this.utils.getAlertifyMsg(
            error,
            this.tr.instant('ldap.test.FAILED'),
            false
          );
        },
      });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
