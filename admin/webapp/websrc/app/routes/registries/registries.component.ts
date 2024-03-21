import { Component, OnInit } from '@angular/core';
import { RegistriesCommunicationService } from './regestries-communication.service';
import { catchError, map } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-registries',
  templateUrl: './registries.component.html',
  styleUrls: ['./registries.component.scss'],
})
export class RegistriesComponent implements OnInit {
  error: unknown;
  registries$ = this.registriesCommunicationService.registries$.pipe(
    map(({ summarys }) => {
      const updatedSummaries = summarys.map(summary => ({
        ...summary,
        use_proxy: !summary.ignore_proxy,
      }));
      return { summarys: updatedSummaries };
    }),
    catchError(err => {
      this.error = err;
      throw err;
    })
  );
  refreshingDetails$ = this.registriesCommunicationService.refreshingDetails$;
  linkedRegistry: string = '';
  linkedImage: string = '';
  linkedTag: string = '';
  private switchClusterSubscription;

  constructor(
    private registriesCommunicationService: RegistriesCommunicationService,
    private multiClusterService: MultiClusterService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      this.linkedRegistry = decodeURIComponent(params['registry'] || '');
      this.linkedImage = decodeURIComponent(params['image'] || '');
      this.linkedTag = decodeURIComponent(params['tag'] || '');
    });
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
    this.registriesCommunicationService.initRefreshingRegistries();
    this.registriesCommunicationService.refreshRegistries();
  }
}
