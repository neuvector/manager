import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subject, throwError, timer } from 'rxjs';
import {
  catchError,
  filter,
  map,
  switchMap,
  take,
  timeout,
} from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Router } from '@angular/router';
import { ServerGetResponse } from '@common/types';

@Component({
  selector: 'app-openid',
  templateUrl: './openid.component.html',
  styleUrls: ['./openid.component.scss'],
})
export class OpenidComponent implements OnInit, OnDestroy {
  private _switchClusterSubscription;
  openidError!: string;
  refreshing$ = new Subject();
  openidData!: { domains: string[]; server: ServerGetResponse };

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        this.router.navigate(['settings']);
      });
    combineLatest([
      this.settingsService.getServer(),
      this.settingsService.getDomain(),
    ])
      .pipe(
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
        })
      )
      .subscribe(openidData => (this.openidData = openidData));
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }
  refresh(): void {
    timer(0, 5000)
      .pipe(
        switchMap(() => this.settingsService.getServer()),
        filter(
          server =>
            !!server.servers.find(({ server_type }) => server_type === 'oidc')
        ),
        take(1),
        timeout(30000),
        catchError(err => {
          this.openidError = err;
          return throwError(err);
        })
      )
      .subscribe(server => {
        this.openidData = { ...this.openidData, server };
      });
  }
}
