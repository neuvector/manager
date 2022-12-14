import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subject, throwError } from 'rxjs';
import { catchError, map, repeatWhen } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-saml',
  templateUrl: './saml.component.html',
  styleUrls: ['./saml.component.scss'],
})
export class SamlComponent implements OnInit, OnDestroy {
  private _switchClusterSubscription;
  samlError!: string;
  refreshing$ = new Subject();
  server$ = this.settingsService.getServer();
  domain$ = this.settingsService.getDomain();
  samlData$ = combineLatest([this.server$, this.domain$]).pipe(
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
    }),
    repeatWhen(() => this.refreshing$)
  );

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this._switchClusterSubscription = this.multiClusterService.onClusterSwitchedEvent$.subscribe(
      data => {
        this.router.navigate(['settings']);
      }
    );
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  refresh(): void {
    this.refreshing$.next(true);
  }
}
