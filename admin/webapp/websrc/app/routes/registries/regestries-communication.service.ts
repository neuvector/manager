import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { RepoGetResponse, Summary } from '@common/types';
import {
  filter,
  finalize,
  map,
  repeatWhen,
  switchMap,
  tap,
} from 'rxjs/operators';
import { RegistriesService } from '@services/registries.service';

interface RegistryDetails {
  selectedRegistry: Summary;
  repositories: RepoGetResponse;
}

@Injectable()
export class RegistriesCommunicationService {
  private timeoutId;
  private refreshRegistriesSubject$ = new Subject();
  private refreshDetailsSubject$ = new Subject();
  private selectedRegistrySubject$ = new BehaviorSubject<Summary | undefined>(
    undefined
  );
  selectedRegistry$: Observable<Summary | undefined> =
    this.selectedRegistrySubject$.asObservable();
  private refreshingDetailsSubject$ = new BehaviorSubject<boolean>(false);
  refreshingDetails$ = this.refreshingDetailsSubject$.asObservable();
  registryDetails$ = this.selectedRegistry$
    .pipe(
      filter(summary => summary !== undefined),
      switchMap(summary =>
        combineLatest([
          this.selectedRegistry$,
          this.registriesService.getRepo(summary!.name).pipe(
            finalize(() => {
              if (this.refreshingDetailsSubject$.value) {
                this.refreshingDetailsSubject$.next(false);
              }
            }),
            repeatWhen(() => this.refreshDetailsSubject$)
          ),
        ])
      ),
      map(([selectedRegistry, repositories]) => {
        return {
          selectedRegistry,
          repositories,
        };
      })
    )
    .pipe() as Observable<RegistryDetails>;
  private startingScanSubject$ = new BehaviorSubject<boolean>(false);
  startingScan$ = this.startingScanSubject$.asObservable();
  private stoppingScanSubject$ = new BehaviorSubject<boolean>(false);
  stoppingScan$ = this.stoppingScanSubject$.asObservable();
  private deletingSubject$ = new BehaviorSubject<boolean>(false);
  deleting$ = this.deletingSubject$.asObservable();
  private savingSubject$ = new BehaviorSubject<boolean>(false);
  registries$ = this.registriesService.getRegistries().pipe(
    tap(({ summarys }) => {
      if (this.selectedRegistrySubject$.value) {
        this.scan(
          summarys.some(summary => {
            return (
              summary.status === 'scanning' &&
              this.selectedRegistrySubject$.value!.name === summary.name
            );
          })
        );
      }
      if (!summarys.length) {
        this.refreshingDetailsSubject$.next(false);
      }
    }),
    finalize(() => {
      if (this.refreshingDetailsSubject$.value) {
        this.refreshDetails();
      }
      this.savingSubject$.next(false);
      this.stoppingScanSubject$.next(false);
      this.deletingSubject$.next(false);
      this.startingScanSubject$.next(false);
    }),
    repeatWhen(() => this.refreshRegistriesSubject$)
  );
  saving$ = this.savingSubject$.asObservable();

  constructor(private registriesService: RegistriesService) {}

  refreshRegistries(): void {
    this.timeoutId = setTimeout(() => {
      this.refreshRegistriesSubject$.next(true);
    }, 1000);
  }

  refreshDetails(): void {
    this.refreshDetailsSubject$.next(true);
  }

  initRefreshingRegistries(): void {
    this.refreshingDetailsSubject$.next(true);
  }

  initStartScan(): void {
    this.startingScanSubject$.next(true);
  }

  initSave(): void {
    this.savingSubject$.next(true);
  }

  cancelSave(): void {
    this.savingSubject$.next(false);
  }

  initDelete(): void {
    this.deletingSubject$.next(true);
  }

  initStopScan(): void {
    this.stoppingScanSubject$.next(true);
  }

  setSelectedRegistry(registry: Summary): void {
    clearTimeout(this.timeoutId);
    this.selectedRegistrySubject$.next(registry);
    if (registry.status === 'scanning') {
      this.refreshRegistries();
    }
  }

  private scan(isScanning: boolean): void {
    if (isScanning) {
      setTimeout(() => {
        this.initRefreshingRegistries();
        this.refreshRegistries();
      }, 4500);
    }
  }
}
