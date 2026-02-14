import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subject, throwError, timer } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SettingsService } from '@services/settings.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Router } from '@angular/router';
import { ServerGetResponse } from '@common/types';
import { pollUntilResult } from '@common/utils/rxjs.utils';

@Component({
  standalone: false,
  selector: 'app-openid',
  templateUrl: './openid.component.html',
  styleUrls: ['./openid.component.scss'],
})
export class OpenidComponent implements OnInit, OnDestroy {
  openidError!: string;
  refreshing$ = new Subject();
  openidData!: { domains: string[]; server: ServerGetResponse };

  private _getClustersFinishSubscription;

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this._getClustersFinishSubscription =
      this.multiClusterService.onGetClustersFinishEvent$.subscribe(() => {
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
    if (this._getClustersFinishSubscription) {
      this._getClustersFinishSubscription.unsubscribe();
    }
  }
  refresh(): void {
    pollUntilResult(
      () => this.settingsService.getServer(),
      server =>
        !!server.servers.find(({ server_type }) => server_type === 'oidc'),
      5000,
      30000
    )
      .pipe(
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
