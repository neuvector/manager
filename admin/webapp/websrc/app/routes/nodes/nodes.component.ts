import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MapConstant } from '@common/constants/map.constant';
import { ErrorResponse, Host, ScanConfig } from '@common/types';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { NodesGridComponent } from '@components/nodes-grid/nodes-grid.component';
import { TranslateService } from '@ngx-translate/core';
import { NodesService } from '@services/nodes.service';
import { NotificationService } from '@services/notification.service';
import { ScanService } from '@services/scan.service';
import { interval, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { GlobalVariable } from '@common/variables/global.variable';

@Component({
  standalone: false,
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.scss'],
})
export class NodesComponent implements OnInit, OnDestroy {
  _nodesGrid!: NodesGridComponent;
  @ViewChild(NodesGridComponent) set nodesGrid(grid: NodesGridComponent) {
    this._nodesGrid = grid;
    if (this._nodesGrid) {
      this._nodesGrid.selectedNode$.subscribe(node => {
        if (node) this.selectedNode = node;
      });
    }
  }
  get nodesGrid() {
    return this._nodesGrid;
  }
  get isRemote() {
    return GlobalVariable.isRemote;
  }
  refreshing$ = new Subject();
  error!: string;
  loaded = false;
  autoScan = new FormControl(false);
  autoScanAuthorized = false;
  isAutoScanAuthorized!: boolean;
  stopFullScan$ = new Subject();
  stopNodeScan$ = new Subject();
  selectedNode!: Host;

  get auto_scan() {
    return this.autoScan.value;
  }
  get nodes() {
    return this.nodesService.nodes;
  }

  constructor(
    private nodesService: NodesService,
    private scanService: ScanService,
    private notificationService: NotificationService,
    private authUtils: AuthUtilsService,
    private tr: TranslateService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAutoScanAuthorized = this.authUtils.getDisplayFlag('runtime_scan');
    this.getNodes();
    if (this.isAutoScanAuthorized) {
      this.getScanConfig();
    }
  }

  ngOnDestroy(): void {
    this.stopNodeScan$.next(true);
    this.stopFullScan$.next(true);
  }

  refresh(cb?: (nodes: Host[]) => void): void {
    this.refreshing$.next(true);
    this.getNodes(cb);
  }

  getNodes(cb?: (nodes: Host[]) => void): void {
    this.nodesService.resetNodes();
    this.nodesService
      .getNodes()
      .pipe(
        // tapOnce(() => this.nodesService.resetNodes()),
        finalize(() => {
          this.loaded = true;
          this.refreshing$.next(false);
          if (cb) cb(this.nodesService.nodes);
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: res => {
          this.nodesService.nodes = res;
          this.error = '';
          if (!this.loaded) this.loaded = true;
        },
        error: ({ error }: { error: ErrorResponse }) => {},
      });
  }

  getScanConfig() {
    this.scanService.getScanConfig().subscribe({
      next: (config: ScanConfig) => {
        this.autoScan.setValue(
          config.enable_auto_scan_host || (config.auto_scan as boolean)
        );
        this.autoScanAuthorized = true;
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === MapConstant.ACC_FORBIDDEN) {
          this.autoScanAuthorized = false;
        } else {
          this.notificationService.openError(
            error.error,
            this.tr.instant('scan.message.CONFIG_ERR')
          );
        }
      },
    });
  }

  configAutoScan(auto_scan: boolean) {
    this.scanService
      .postScanConfig({ enable_auto_scan_host: auto_scan })
      .subscribe(() => {
        if (auto_scan) {
          interval(8000)
            .pipe(takeUntil(this.stopFullScan$))
            .subscribe(() => {
              this.refresh(nodes => {
                if (this.scanService.isScanNodesFinished(nodes))
                  this.stopFullScan$.next(true);
              });
            });
        } else {
          this.stopFullScan$.next(true);
        }
      });
  }

  configScan(selectedNode: Host) {
    this.scanService.scanNode(selectedNode.id).subscribe({
      complete: () => {
        this.notificationService.open(this.tr.instant('scan.START_SCAN'));
        selectedNode.scan_summary.status = 'scanning';
        this.nodesGrid.gridApi
          .getRowNode(selectedNode.id)
          ?.setData(selectedNode);
        interval(5000)
          .pipe(takeUntil(this.stopNodeScan$))
          .subscribe(() => {
            this.refresh(nodes => {
              const node = nodes.find(w => w.id === selectedNode.id);
              if (!node || this.scanService.isNodeScanFinished(node)) {
                this.stopNodeScan$.next(true);
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
