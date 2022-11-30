import { Component } from '@angular/core';
import { combineLatest, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  selector: 'app-saml',
  templateUrl: './saml.component.html',
  styleUrls: ['./saml.component.scss'],
})
export class SamlComponent {
  private _switchClusterSubscription;
  samlError!: string;
  server$ = this.settingsService.getServer();
  domain$ = this.settingsService.getDomain();
  samlData$ = this.loadData();

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.server$ = this.settingsService.getServer();
        this.domain$ = this.settingsService.getDomain();
        this.samlData$ = this.loadData();
      });
  }

  private loadData() {
    return combineLatest([this.server$, this.domain$]).pipe(
      map(([server, domain]) => {
        return {
          server,
          domains: domain.domains
            .map(d => d.name)
            .filter(name => name.charAt(0) !== '_'),
        };
      }),
      catchError(err => {
        this.samlError = err;
        return throwError(err);
      })
    );
  }
}
