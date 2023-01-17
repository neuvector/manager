import { Component, OnInit } from '@angular/core';
import { RegistriesCommunicationService } from './regestries-communication.service';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RegistryGetResponse } from '@common/types';
import { MultiClusterService } from '@services/multi-cluster.service';
import { SummaryService } from '@services/summary.service';

@Component({
  selector: 'app-registries',
  templateUrl: './registries.component.html',
  styleUrls: ['./registries.component.scss'],
})
export class RegistriesComponent implements OnInit {
  error: unknown;
  registries$: Observable<RegistryGetResponse>;
  refreshingDetails$: Observable<any>;
  private switchClusterSubscription;

  constructor(
    private registriesCommunicationService: RegistriesCommunicationService,
    private multiClusterService: MultiClusterService,
    private summaryService: SummaryService
  ) {
    this.registries$ = this.registriesCommunicationService.registries$.pipe(
      catchError(err => {
        this.error = err;
        throw err;
      })
    );
    this.refreshingDetails$ = this.registriesCommunicationService.refreshingDetails$;
  }

  ngOnInit(): void {
    //refresh the page when it switched to a remote cluster
    this.switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this.switchClusterSubscription) {
      this.switchClusterSubscription.unsubscribe();
    }
  }

  refresh(): void {
    this.summaryService.refreshSummary();
    this.registriesCommunicationService.initRefreshingRegistries();
    this.registriesCommunicationService.refreshRegistries();
  }
}
