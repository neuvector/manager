import { Component } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  selector: 'app-license',
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.scss'],
})
export class LicenseComponent {
  private _switchClusterSubscription;
  licenseError: unknown;
  renewLicenseView = false;
  license$ = this.settingsService.getLicense().pipe(
    catchError(err => {
      this.licenseError = err;
      return throwError(err);
    })
  );

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.license$ = this.settingsService.getLicense().pipe(
          catchError(err => {
            this.licenseError = err;
            return throwError(err);
          })
        );
      });
  }

  toggleRenewLicenseView(): void {
    this.renewLicenseView = !this.renewLicenseView;
  }
}
