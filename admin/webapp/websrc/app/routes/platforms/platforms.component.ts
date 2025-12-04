import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MapConstant } from '@common/constants/map.constant';
import { ErrorResponse, Platform, ScanConfig } from '@common/types';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { PlatformsGridComponent } from '@components/platforms-grid/platforms-grid.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { PlatformsService } from '@services/platforms.service';
import { ScanService } from '@services/scan.service';
import { interval, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { MultiClusterService } from '@services/multi-cluster.service';
import { GlobalVariable } from '@common/variables/global.variable';


@Component({
  standalone: false,
  selector: 'app-platforms',
  templateUrl: './platforms.component.html',
  styleUrls: ['./platforms.component.scss'],
  
})
export class PlatformsComponent implements OnInit, OnDestroy {
  _platformsGrid!: PlatformsGridComponent;
  @ViewChild(PlatformsGridComponent) set platformsGrid(
    grid: PlatformsGridComponent
  ) {
    this._platformsGrid = grid;
    if (this._platformsGrid) {
      this._platformsGrid.selectedPlatform$.subscribe(platform => {
        if (platform) this.selectedPlatform = platform;
      });
    }
  }
  get platformsGrid() {
    return this._platformsGrid;
  }
  get isRemote() {
    return GlobalVariable.isRemote;
  }
  refreshing$ = new Subject();
  error!: string;
  loaded = false;
  isAutoScanAuthorized!: boolean;
  stopPlatformScan$ = new Subject();
  selectedPlatform!: Platform;
  private _switchClusterSubscription;

  get platforms() {
    return this.platformsService.platforms;
  }

  constructor(
    private platformsService: PlatformsService,
    private scanService: ScanService,
    private authUtils: AuthUtilsService,
    private notificationService: NotificationService,
    private tr: TranslateService,
    private cd: ChangeDetectorRef,
    private multiClusterService: MultiClusterService
  ) {}

  ngOnInit(): void {
    this.isAutoScanAuthorized = this.authUtils.getDisplayFlag('runtime_scan');
    this.getPlatforms();

    //refresh the page when it switched to a remote cluster
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    this.stopPlatformScan$.next(true);
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  refresh(cb?: (platforms: Platform[]) => void): void {
    this.refreshing$.next(true);
    this.getPlatforms(cb);
  }

  getPlatforms(cb?: (platforms: Platform[]) => void): void {
    this.platformsService.resetPlatforms();
    this.platformsService
      .getPlatforms()
      .pipe(
        // tapOnce(() => this.nodesService.resetNodes()),
        finalize(() => {
          this.loaded = true;
          this.refreshing$.next(false);
          if (cb) cb(this.platformsService.platforms);
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: res => {
          this.platformsService.platforms = res;
          this.error = '';
          if (!this.loaded) this.loaded = true;
        },
        error: ({ error }: { error: ErrorResponse }) => {},
      });
  }

  configScan(selectedPlatform: Platform) {
    this.scanService.scanPlatform(selectedPlatform.platform).subscribe({
      complete: () => {
        this.notificationService.open(this.tr.instant('scan.START_SCAN'));
        selectedPlatform.status = 'scanning';
        this.platformsGrid.gridApi
          .getRowNode(selectedPlatform.platform)
          ?.setData(selectedPlatform);
        interval(5000)
          .pipe(takeUntil(this.stopPlatformScan$))
          .subscribe(() => {
            this.refresh(platforms => {
              const platform = platforms.find(
                p => p.platform === selectedPlatform.platform
              );
              if (
                !platform ||
                this.scanService.isPlatformScanFinished(platform)
              ) {
                this.stopPlatformScan$.next(true);
              }
            });
          });
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.openError(
          error,
          this.tr.instant('scan.FAILED_SCAN')
        );
      },
    });
  }
}
