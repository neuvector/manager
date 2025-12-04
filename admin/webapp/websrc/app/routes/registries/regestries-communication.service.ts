import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { RepoGetResponse, Summary } from '@common/types';
import {
  filter,
  finalize,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { RegistriesService } from '@services/registries.service';
import { FormControl } from '@angular/forms';

export interface RegistryDetails {
  selectedRegistry: Summary;
  isAllView: boolean;
  repositories?: RepoGetResponse;
  allScannedImagesSummary?: any;
}

@Injectable()
export class RegistriesCommunicationService {
  private refreshRegistryTypeSubject$ = new Subject();
  private refreshRegistriesSubject$ = new Subject();
  private refreshDetailsSubject$ = new Subject();
  private selectedRegistrySubject$ = new BehaviorSubject<Summary | undefined>(
    undefined
  );
  detailFilter: FormControl;
  selectedRegistry$: Observable<Summary | undefined> =
    this.selectedRegistrySubject$.asObservable();
  private refreshingDetailsSubject$ = new BehaviorSubject<boolean>(false);
  refreshingDetails$ = this.refreshingDetailsSubject$.asObservable();
  registryDetails$ = this.selectedRegistry$
    .pipe(
      filter(summary => summary !== undefined),
      // distinctUntilChanged(),
      switchMap(summary => {
        if (!!summary!.isAllView) {
          return this.registriesService.getAllScannedImagesSummary().pipe(
            map(allScannedImagesSummary => ({
              selectedRegistry: summary,
              isAllView: true,
              isFedRepo: false,
              allScannedImagesSummary,
            })),
            finalize(() => {
              if (this.refreshingDetailsSubject$.value) {
                this.refreshingDetailsSubject$.next(false);
              }
            })
          );
        } else if (!!summary!.isFedRepo) {
          return this.registriesService
            .getFederatedRepoScanRegistrySummary(summary!.name)
            .pipe(
              map(repositories => ({
                selectedRegistry: summary,
                isAllView: false,
                isFedRepo: true,
                repositories,
              })),
              finalize(() => {
                if (this.refreshingDetailsSubject$.value) {
                  this.refreshingDetailsSubject$.next(false);
                }
              })
            );
        } else {
          return this.registriesService.getRepo(summary!.name).pipe(
            map(repositories => ({
              selectedRegistry: summary,
              isAllView: false,
              repositories,
            })),
            finalize(() => {
              if (this.refreshingDetailsSubject$.value) {
                this.refreshingDetailsSubject$.next(false);
              }
            })
          );
        }
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
  registryTypes$ = this.registriesService.getRegistryTypes().pipe();
  registries$ = this.refreshRegistriesSubject$.pipe(
    startWith(null),

    switchMap(() =>
      this.registriesService.getRegistries().pipe(
        tap(({ summarys }) => {
          this.scan(summarys.some(summary => summary.status === 'scanning'));

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
        })
      )
    )
  );

  saving$ = this.savingSubject$.asObservable();
  get selectedRegistry() {
    return this.selectedRegistrySubject$.value;
  }

  constructor(private registriesService: RegistriesService) {}

  refreshRegistries(delay?: number): void {
    if (delay) {
      setTimeout(() => this.refreshRegistriesSubject$.next(true), delay);
    } else {
      this.refreshRegistriesSubject$.next(true);
    }
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

  cancelStartScan(): void {
    this.startingScanSubject$.next(false);
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

  setSelectedRegistry(registry: Summary | undefined): void {
    this.selectedRegistrySubject$.next(registry);
  }

  private scan(isScanning: boolean): void {
    if (isScanning) {
      setTimeout(() => {
        this.initRefreshingRegistries();
        this.refreshRegistries();
      }, 5000);
    }
  }
}
