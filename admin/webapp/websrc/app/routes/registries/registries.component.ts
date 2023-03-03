import { Component, OnInit } from '@angular/core';
import { RegistriesCommunicationService } from './regestries-communication.service';
import { catchError } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';

@Component({
  selector: 'app-registries',
  templateUrl: './registries.component.html',
  styleUrls: ['./registries.component.scss'],
})
export class RegistriesComponent implements OnInit {
  error: unknown;
  registries$ = this.registriesCommunicationService.registries$.pipe(
    catchError(err => {
      this.error = err;
      throw err;
    })
  );
  refreshingDetails$ = this.registriesCommunicationService.refreshingDetails$;
  private switchClusterSubscription;

  constructor(
    private registriesCommunicationService: RegistriesCommunicationService,
    private multiClusterService: MultiClusterService
  ) {}

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
    this.registriesCommunicationService.initRefreshingRegistries();
    this.registriesCommunicationService.refreshRegistries();
  }
}
