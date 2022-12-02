import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subject, throwError } from 'rxjs';
import { catchError, map, repeatWhen } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  selector: 'app-openid',
  templateUrl: './openid.component.html',
  styleUrls: ['./openid.component.scss'],
})
export class OpenidComponent implements OnInit, OnDestroy {
  private _switchClusterSubscription;
  openidError!: string;
  refreshing$ = new Subject();
  server$ = this.settingsService.getServer();
  domain$ = this.settingsService.getDomain();
  openidData$ = combineLatest([this.server$, this.domain$]).pipe(
    map(([server, domain]) => {
      return {
        server,
        domains: domain.domains
          .map(d => d.name)
          .filter(name => name.charAt(0) !== '_'),
      };
    }),
    catchError(err => {
      this.openidError = err;
      return throwError(err);
    }),
    repeatWhen(() => this.refreshing$)
  );

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        this.refresh();
      });
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
