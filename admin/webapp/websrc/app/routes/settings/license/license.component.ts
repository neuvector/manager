import { Component, OnDestroy, OnInit } from '@angular/core';
import { SettingsService } from '@services/settings.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';


@Component({
  standalone: false,
  selector: 'app-license',
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.scss'],
  
})
export class LicenseComponent implements OnInit, OnDestroy {
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
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        this.license$ = this.settingsService.getLicense().pipe(
          catchError(err => {
            this.licenseError = err;
            return throwError(err);
          })
        );
      });
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }
  toggleRenewLicenseView(): void {
    this.renewLicenseView = !this.renewLicenseView;
  }
}
