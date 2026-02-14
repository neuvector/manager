import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { GraphService } from '../graph.service';
import { SniffService } from './sniff.service';
import { GridApi, GridOptions } from 'ag-grid-community';
import {
  ActivityState,
  PopupState,
} from '@common/types/network-activities/activityState';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import { ChangeContext, Options } from '@angular-slider/ngx-slider';
import { DomSanitizer } from '@angular/platform-browser';
import { interval, Subscription } from 'rxjs';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import * as $ from 'jquery';

@Component({
  standalone: false,
  selector: 'app-sniffer',
  templateUrl: './sniffer.component.html',
  styleUrls: ['./sniffer.component.scss'],
})
export class SnifferComponent implements OnInit, OnDestroy {
  isPacketCapAuthorized: boolean = false;
  sniffer: any;
  exportUrl: any;
  downloadId: any;
  exportFilename: string = '';
  onSnifferErr: boolean = false;
  snifferErrMsg: string = '';
  errorMsg: string = '';

  private sniffOnId: string = '';

  disabled: boolean = false;

  get entriesGridHeight(): number {
    return this._entriesGridHeight;
  }
  @ViewChild('sniffers', { static: false }) containerSniffView!: ElementRef;
  @ViewChild('entriesGridHeight', { static: false }) heightView!: ElementRef;

  private _sniffers;

  gridOptions: GridOptions;
  gridApi!: GridApi;

  pcap;
  options: Options = {};

  private _entriesGridHeight: number = 0;

  _popupState: ActivityState;

  get popupState() {
    return this._popupState;
  }

  @Input() containerName;
  @Input() containerId;

  @Input()
  set popupState(value: ActivityState) {
    this._popupState = value;
  }

  constructor(
    private translate: TranslateService,
    private authUtilsService: AuthUtilsService,
    private utils: UtilsService,
    private sanitizer: DomSanitizer,
    public graphService: GraphService,
    public sniffService: SniffService
  ) {
    this._popupState = new ActivityState(PopupState.onInit);
  }

  get sniffers() {
    return this._sniffers;
  }

  @Input()
  set sniffers(value) {
    this._sniffers = value;
  }

  @Input()
  set entriesGridHeight(value) {
    this._entriesGridHeight = value;
  }

  ngOnInit() {
    this.isPacketCapAuthorized =
      this.authUtilsService.getDisplayFlag('write_network_rule');
    this.sniffService.prepareSnifferColumns();
    this.gridOptions = this.sniffService.snifferGridOptions;
    this.gridOptions.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi = params.api;
      }
      setTimeout(() => {
        if (params && params.api) {
          params.api.sizeColumnsToFit();
        }
      }, 500);
      $win.on(GlobalConstant.AG_GRID_RESIZE, () => {
        setTimeout(() => {
          if (params && params.api) {
            params.api.sizeColumnsToFit();
          }
        }, 1000);
      });
    };
    this.gridOptions.onSelectionChanged = () => {
      this.onSnifferChanged();
    };

    const MINUTES = this.translate.instant('setting.MINUTES');
    const SECONDS = this.translate.instant('setting.SECONDS');
    const convertMinutes = value => {
      if (!value) return '';
      let minutes = Math.floor(value / 60);
      let seconds = Math.round(value % 60);

      let sec = seconds === 0 ? '' : `${seconds}${SECONDS}`;
      if (seconds === 1) sec = sec.replace('s', '');
      let min = minutes === 0 ? '' : `${minutes}${MINUTES}`;
      if (minutes === 1) min = min.replace('s', '');
      if (!minutes) return `${sec}`;
      return seconds > 0 ? `${min}, ${sec}` : `${min}`;
    };

    this.options = {
      floor: 0,
      minRange: 5,
      ceil: 600,
      step: 5,
      tickStep: 30,
      showSelectionBar: true,
      disabled: true,
      showTicks: true,
      translate: convertMinutes,
    };

    this.pcap = {
      seconds: 0,
      minValue: 5,
      options: this.options,
    };
  }

  onUserChangeEnd(changeContext: ChangeContext): void {
    this.pcap.seconds = changeContext.value;
  }

  onSnifferChanged() {
    let selectedRows = this.gridApi.getSelectedRows();
    this.sniffer = selectedRows[0];
  }

  getSniffers = response => {
    this.sniffers = response['sniffers'];
    if (this.sniffers?.length > 0) {
      let runningSniffer = this.sniffers.find(
        item => item.status === 'running'
      );
      if (!!runningSniffer) {
        this.gridApi.forEachNode(node => {
          if (node.data.status === 'running') {
            node.setSelected(true);
            this.gridApi.ensureNodeVisible(node);
          }
        });
        if (!this.snifferSubscription) {
          if (!this.sniffOnId) this.sniffOnId = this.containerId;
          this.pullSniffers();
        }
      } else {
        this.stopRefresh();
        this.gridApi.forEachNode((node, index) => {
          if (this.sniffer !== null) {
            if (node.data.id === this.sniffer.id) {
              node.setSelected(true);
              this.gridApi.ensureNodeVisible(node);
            }
          } else if (index === 0) {
            node.setSelected(true);
            this.gridApi.ensureNodeVisible(node);
          }
        });
        if (this.sniffer !== null) this.sniffer.status = 'stopped';
      }
      let selectedRows = this.gridApi.getSelectedRows();
      this.sniffer = selectedRows[0];
    }
  };

  startSniff = containerId => {
    let snifferParam = { duration: 0 };
    if (!this.pcap.options.disabled && this.pcap.seconds)
      snifferParam.duration = this.pcap.seconds;

    this.sniffService.startSniff(containerId, snifferParam).subscribe(
      () => {
        this.refreshSniffer();
        this.pullSniffers();
      },
      err => {
        this.onSnifferErr = true;
        this.snifferErrMsg = this.utils.getErrorMessage(err);
      }
    );
  };

  toggleSchedule = () => {
    if (!this.disabled) this.pcap.seconds = 0;
    this.pcap.options = Object.assign({}, this.pcap.options, {
      disabled: !this.disabled,
    });
  };

  disableStart = () => {
    if (!this.sniffers) return false;
    let startedJob = this.sniffers.filter(v => v.status === 'running')[0];
    return !!startedJob;
  };

  stopSniff = jobId =>
    this.sniffService.stopSniff(jobId).subscribe(
      () => this.refreshSniffer(),
      err => {
        console.warn(err);
        this.onSnifferErr = true;
        this.snifferErrMsg = this.utils.getErrorMessage(err);
      }
    );

  deleteSniff = jobId =>
    this.sniffService.deleteSniff(jobId).subscribe(
      () => {
        this.refreshSniffer();
        this.sniffer = null;
      },
      err => {
        console.warn(err);
        this.onSnifferErr = true;
        this.snifferErrMsg = this.utils.getErrorMessage(err);
      }
    );

  downloadPacket = jobId => {
    this.errorMsg = '';
    this.sniffService.downloadPacket(jobId).subscribe(
      response => {
        let raw = response.headers.get('Content-Type');
        let nameAndParts = this.sniffService.multiPart_parse(
          response.body,
          raw
        );
        this.exportFilename = nameAndParts.filename;
        this.exportUrl = this.sanitizer.bypassSecurityTrustUrl(
          URL.createObjectURL(
            new Blob([nameAndParts.parts[nameAndParts.filename]])
          )
        );
        this.downloadId = jobId;
      },
      error => {
        console.warn(error);
        this.errorMsg = error.error;
      }
    );
  };

  snifferSubscription: Subscription | undefined;
  snifferRefreshTimer$;

  stopRefresh() {
    return this.snifferSubscription && this.snifferSubscription.unsubscribe();
  }

  refreshSniffer = () => {
    this.onSnifferErr = false;
    this.sniffService.getSniffers(this.containerId).subscribe(
      response => {
        //this.sniffers = response['sniffers'];
        this.getSniffers(response);
      },
      err => {
        console.warn(err);
        this.onSnifferErr = true;
        this.snifferErrMsg = this.utils.getErrorMessage(err);
      }
    );
  };

  pullSniffers() {
    this.snifferRefreshTimer$ = interval(5000);
    this.snifferSubscription = this.snifferRefreshTimer$.subscribe(
      this.refreshSniffer.bind(this)
    );
  }

  mouseUp(event) {
    if (event.target?.id == 'sniffer') {
      this._entriesGridHeight = event.target.clientHeight - 190;
      this.gridApi.resetRowHeights();
      this.gridApi.sizeColumnsToFit();
    }
  }

  ngOnDestroy(): void {
    this.stopRefresh();
  }
}
