import { Component } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-license',
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.scss'],
})
export class LicenseComponent {
  licenseError: unknown;
  renewLicenseView = false;
  license$ = this.settingsService.getLicense().pipe(
    catchError(err => {
      this.licenseError = err;
      return throwError(err);
    })
  );

  constructor(private settingsService: SettingsService) {}

  toggleRenewLicenseView(): void {
    this.renewLicenseView = !this.renewLicenseView;
  }
}
