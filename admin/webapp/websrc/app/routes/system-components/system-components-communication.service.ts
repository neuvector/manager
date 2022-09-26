import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  ChartDataUpdate,
  ContainerChartUpdate,
  Controller,
  Enforcer,
  Scanner,
} from '@common/types';
import { EnforcersService } from '@services/enforcers.service';
import { delay, map, repeatWhen } from 'rxjs/operators';
import { ControllersService } from '@services/controllers.service';
import { UtilsService } from '@common/utils/app.utils';

export interface SystemComponentsStats {
  controller: Subscription | null;
  enforcer: Subscription | null;
}

@Injectable()
export class SystemComponentsCommunicationService {
  private selectedControllerSubject$ = new BehaviorSubject<
    Controller | undefined
  >(undefined);
  selectedController$: Observable<Controller | undefined> =
    this.selectedControllerSubject$.asObservable();

  private selectedScannerSubject$ = new BehaviorSubject<Scanner | undefined>(
    undefined
  );
  selectedScanner$: Observable<Scanner | undefined> =
    this.selectedScannerSubject$.asObservable();

  private selectedEnforcerSubject$ = new BehaviorSubject<Enforcer | undefined>(
    undefined
  );
  selectedEnforcer$: Observable<Enforcer | undefined> =
    this.selectedEnforcerSubject$.asObservable();
  systemComponentStats: SystemComponentsStats = {
    controller: null,
    enforcer: null,
  };

  constructor(
    private enforcersService: EnforcersService,
    private controllersService: ControllersService,
    private utils: UtilsService
  ) {}

  setSelectedController(controller: Controller | undefined) {
    this.selectedControllerSubject$.next(controller);
  }

  setSelectedScanner(scanner: Scanner | undefined) {
    this.selectedScannerSubject$.next(scanner);
  }

  setSelectedEnforcer(enforcer: Enforcer | undefined) {
    this.selectedEnforcerSubject$.next(enforcer);
  }

  startControllerStats(
    currentController: Controller
  ): Observable<ChartDataUpdate> {
    return this.controllersService
      .getControllerStats(currentController.id)
      .pipe(
        map(statsData => this.utils.parseControllerStats(statsData)),
        repeatWhen(res => res.pipe(delay(5000)))
      );
  }

  startEnforcerStats(
    currentEnforcer: Enforcer
  ): Observable<ContainerChartUpdate> {
    return this.enforcersService.getEnforcerStats(currentEnforcer.id).pipe(
      map(statsData => this.utils.parseContainerStats(statsData)),
      repeatWhen(res => res.pipe(delay(5000)))
    );
  }

  clearStats() {
    if (this.systemComponentStats.controller) {
      this.systemComponentStats.controller.unsubscribe();
      this.systemComponentStats.controller = null;
    }
    if (this.systemComponentStats.enforcer) {
      this.systemComponentStats.enforcer.unsubscribe();
      this.systemComponentStats.enforcer = null;
    }
  }
}
