import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { Enforcer, ErrorResponse } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { ContainerStatsComponent } from '@components/container-stats/container-stats.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { Subscription } from 'rxjs';
import { SystemComponentsCommunicationService } from '../system-components-communication.service';

@Component({
  standalone: false,
  selector: 'app-enforcer-details',
  templateUrl: './enforcer-details.component.html',
  styleUrls: ['./enforcer-details.component.scss'],
})
export class EnforcerDetailsComponent implements OnInit, OnDestroy {
  @ViewChild(ContainerStatsComponent) containerStats!: ContainerStatsComponent;
  @ViewChild('detailsTabGroup', { static: false })
  detailsTabGroup!: MatTabGroup;
  activeTabIndex: number = 0;
  currentEnforcer!: Enforcer | undefined;
  get isDisconnected() {
    return this.currentEnforcer?.connection_state === 'disconnected';
  }
  get statsSub() {
    return this.componentsCommunicationService.systemComponentStats.enforcer;
  }
  set statsSub(sub: Subscription | null) {
    this.componentsCommunicationService.systemComponentStats.enforcer = sub;
  }

  constructor(
    private componentsCommunicationService: SystemComponentsCommunicationService,
    private tr: TranslateService,
    private utils: UtilsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initTabs();
    this.componentsCommunicationService.selectedEnforcer$.subscribe(
      enforcer => {
        this.currentEnforcer = enforcer;
        if (!this.currentEnforcer) return;
        if (this.containerStats) {
          this.containerStats.clearCharts();
        }
        if (
          this.activeTabIndex === 1 &&
          this.containerStats.charts.length > 0 &&
          this.containerStats.charts.toArray().every(c => c.chart)
        ) {
          this.getStats();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.clearStatsSub();
  }

  clearStatsSub(): void {
    if (this.statsSub && !this.statsSub.closed) {
      this.statsSub.unsubscribe();
      this.statsSub = null;
    }
  }

  getStats(): void {
    this.clearStatsSub();
    if (this.currentEnforcer && !this.isDisconnected) {
      this.statsSub = this.componentsCommunicationService
        .startEnforcerStats(this.currentEnforcer)
        .subscribe({
          next: ({ cpu, byte, session }) => {
            this.containerStats.updateCharts(cpu, byte, session);
          },
          error: ({ error }: { error: ErrorResponse }) => {
            this.notificationService.openError(
              error,
              this.tr.instant('general.UNFORMATTED_ERR')
            );
          },
        });
    }
  }

  initTabs() {
    this.activeTabIndex = 0;
    if (this.detailsTabGroup) {
      this.detailsTabGroup.selectedIndex = this.activeTabIndex;
      this.detailsTabGroup.realignInkBar();
    }
  }

  activateTab(event): void {
    this.activeTabIndex = event.index;
    switch (this.activeTabIndex) {
      case 0:
        this.clearStatsSub();
        break;
      case 1:
        this.getStats();
        break;
    }
  }
}
