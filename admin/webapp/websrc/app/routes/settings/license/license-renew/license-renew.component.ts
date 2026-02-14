import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ErrorResponse } from '@common/types';
import { SettingsService } from '@services/settings.service';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-license-renew',
  templateUrl: './license-renew.component.html',
  styleUrls: ['./license-renew.component.scss'],
})
export class LicenseRenewComponent {
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() cancel = new EventEmitter();
  submittingForm = false;
  errorMessage!: string;
  renewLicenseForm = new FormGroup({
    license_key: new FormControl('', Validators.required),
  });

  constructor(private settingService: SettingsService) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.submittingForm = true;
    this.settingService
      .renewLicense(this.renewLicenseForm.value)
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

  onCancel(): void {
    this.cancel.emit();
  }
}
