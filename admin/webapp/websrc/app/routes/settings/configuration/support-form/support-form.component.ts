import { Component, Input, ViewChild } from '@angular/core';
import { ErrorResponse } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { shorten } from '@common/utils/common.utils';
import { EnforcersGridComponent } from '@components/enforcers-grid/enforcers-grid.component';
import { TranslateService } from '@ngx-translate/core';
import { EnforcersService } from '@services/enforcers.service';
import { NotificationService } from '@services/notification.service';
import { SettingsService } from '@services/settings.service';
import { saveAs } from 'file-saver';
import { Subject, timer } from 'rxjs';
import { filter, finalize, switchMap, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-support-form',
  templateUrl: './support-form.component.html',
  styleUrls: ['./support-form.component.scss'],
})
export class SupportFormComponent {
  @ViewChild(EnforcersGridComponent) enforcersGrid!: EnforcersGridComponent;
  @Input() debug_enabled!: boolean;
  downloadingUsage = false;
  collectingLog = false;
  collectingLogReady = false;
  stopCollect$ = new Subject<boolean>();

  constructor(
    private settingsService: SettingsService,
    private enforcersService: EnforcersService,
    private utils: UtilsService,
    private tr: TranslateService,
    private notificationService: NotificationService
  ) {}

  submitDebug(): void {
    let body = {
      controller_debug: this.debug_enabled ? ['cpath'] : [],
    };
    this.settingsService.patchConfigDebug(body).subscribe({
      complete: () => {
        if (this.debug_enabled) {
          this.notificationService.open(
            this.tr.instant('setting.ENABLED_CPATH_OK')
          );
        } else {
          this.notificationService.open(
            this.tr.instant('setting.DISABLED_CPATH_OK')
          );
        }
      },
      error: ({ error }: { error: ErrorResponse }) => {
        if (this.debug_enabled) {
          this.notificationService.open(
            this.tr.instant('setting.ENABLED_CPATH_NG')
          );
        } else {
          this.notificationService.open(
            this.tr.instant('setting.DISABLED_CPATH_NG')
          );
        }
        console.log(error);
      },
    });
  }

  usageReport(): void {
    this.downloadingUsage = true;
    this.enforcersService
      .getUsageReport()
      .pipe(
        finalize(() => {
          this.downloadingUsage = false;
        })
      )
      .subscribe(
        usage => {
          let usageJson = JSON.stringify(usage, null, '\t');
          let exportUrl = new Blob([usageJson], {
            type: 'application/json',
          });
          saveAs(
            exportUrl,
            `Usage report_${this.utils.parseDatetimeStr(new Date())}`
          );
        },
        ({ error }: { error: ErrorResponse }) => {
          this.notificationService.open(
            this.tr.instant('setting.EXPORT_FAILED')
          );
          console.warn(error);
        }
      );
  }

  handleLog() {
    timer(0, 5000)
      .pipe(
        switchMap(() => this.enforcersService.checkDebug()),
        filter(res => res.status === 200),
        take(1),
        takeUntil(this.stopCollect$),
        finalize(() => (this.collectingLog = false))
      )
      .subscribe(
        () => (this.collectingLogReady = true),
        ({ error }: { error: ErrorResponse }) => {
          this.notificationService.open(
            this.tr.instant('setting.COLLOECT_FAILED')
          );
          console.warn(error);
        }
      );
  }

  collectLog(): void {
    this.collectingLog = true;
    let enforcerParam =
      this.enforcersGrid.selectedNodes.length ===
      this.enforcersService.enforcers.length
        ? 'ALL'
        : this.enforcersGrid.selectedNodes
            .map(node => shorten(node.data.id, 12))
            .join(',');
    this.enforcersService.postSystemDebug(enforcerParam).subscribe(
      () => {
        this.handleLog();
      },
      ({ error }: { error: ErrorResponse }) => {
        this.notificationService.open(
          this.tr.instant('setting.COLLOECT_FAILED')
        );
        console.warn(error);
      }
    );
  }

  downloadLog(): void {
    if (!this.collectingLogReady) return;
    this.enforcersService.getDebug().subscribe(res => {
      let filename = `nvsupport_${this.utils.parseDatetimeStr(new Date())}.gz`;
      let exportUrl = new Blob([res], {
        type: 'application/x-gzip',
      });
      saveAs(exportUrl, filename);
    });
  }

  cancelCollect(): void {
    this.stopCollect$.next(true);
  }
}
