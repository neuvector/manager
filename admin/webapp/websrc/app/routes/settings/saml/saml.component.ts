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
  selector: 'app-saml',
  templateUrl: './saml.component.html',
  styleUrls: ['./saml.component.scss'],
})
export class SamlComponent implements OnInit, OnDestroy {
  private _getClustersFinishSubscription;
  samlError!: string;
  refreshing$ = new Subject();
  samlData!: { domains: string[]; server: ServerGetResponse };

  constructor(
    private multiClusterService: MultiClusterService,
    private settingsService: SettingsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this._getClustersFinishSubscription =
      this.multiClusterService.onGetClustersFinishEvent$.subscribe(data => {
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
          this.samlError = err;
          return throwError(err);
        })
      )
      .subscribe(samlData => (this.samlData = samlData));
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
        !!server.servers.find(({ server_type }) => server_type === 'saml'),
      5000,
      30000
    )
      .pipe(
        catchError(err => {
          this.samlError = err;
          return throwError(err);
        })
      )
      .subscribe(server => {
        this.samlData = { ...this.samlData, server };
      });
  }
}
