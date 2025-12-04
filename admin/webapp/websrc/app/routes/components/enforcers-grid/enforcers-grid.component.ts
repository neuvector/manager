import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SecurityContext,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { GlobalConstant } from '@common/constants/global.constant';
import { Enforcer } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { EnforcersService } from '@services/enforcers.service';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IRowNode,
  RowSelectedEvent,
} from 'ag-grid-community';
import * as moment from 'moment';
import * as $ from 'jquery';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { EnforcersGridStatusCellComponent } from './enforcers-grid-status-cell/enforcers-grid-status-cell.component';
import { MultiClusterService } from '@services/multi-cluster.service';
import { finalize, map } from 'rxjs/operators';


@Component({
  standalone: false,
  selector: 'app-enforcers-grid',
  templateUrl: './enforcers-grid.component.html',
  styleUrls: ['./enforcers-grid.component.scss'],
  
})
export class EnforcersGridComponent implements OnInit, OnChanges, OnDestroy {
  private readonly $win;
  @Input() selectable = false;
  @Input() refreshable = true;
  @Input() gridHeight: number = 200;
  @Input() resize!: boolean;
  @Input() isVisible: boolean = true;
  refreshing$ = new Subject();
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filtered: boolean = false;
  filteredCount!: number;
  selectedNodes: IRowNode[] = [];
  selectedEnforcerSubject$ = new BehaviorSubject<Enforcer | undefined>(
    undefined
  );
  selectedEnforcer: Observable<Enforcer | undefined> =
    this.selectedEnforcerSubject$.asObservable();
  downloadingUsage = false;
  collectingLog = false;
  collectingLogReady = false;
  stopCollect$ = new Subject<boolean>();
  private switchClusterSubscription;

  get MAX_SELECTED_ENFORCER() {
    return GlobalConstant.MAX_ENFORCER_LOG;
  }
  get enforcerCount() {
    return this.enforcersService.enforcers.length;
  }

  constructor(
    public enforcersService: EnforcersService,
    private tr: TranslateService,
    private utils: UtilsService,
    private multiClusterService: MultiClusterService,
    private sanitizer: DomSanitizer
  ) {
    this.$win = $(GlobalVariable.window);
  }

  prepareGrid(selectable: boolean): GridOptions {
    let columnDefs: ColDef[] = [
      {
        headerName: this.tr.instant('enforcers.detail.NAME'),
        field: 'display_name',
        headerCheckboxSelection: selectable,
        headerCheckboxSelectionFilteredOnly: selectable,
        checkboxSelection: selectable,
        width: 200,
      },
      {
        headerName: this.tr.instant('enforcers.detail.HOST_NAME'),
        field: 'host_name',
        width: 100,
      },
      {
        headerName: this.tr.instant('enforcers.detail.CLUSTER_IP'),
        field: 'cluster_ip',
        width: 140,
      },
      {
        headerName: this.tr.instant('enforcers.detail.STATUS'),
        field: 'connection_state',
        cellRenderer: 'statusCellRenderer',
        width: 90,
      },
      {
        headerName: this.tr.instant('enforcers.detail.VERSION'),
        field: 'version',
        icons: {
          sortAscending: '<em class="fa fa-sort-numeric-down"/>',
          sortDescending: '<em class="fa fa-sort-numeric-up"/>',
        },
        width: 160,
      },
      {
        headerName: this.tr.instant('controllers.detail.DURATION'),
        cellRenderer: params => {
          /** @namespace params.data.joined_at */
          const diff = moment().diff(params.data.started_at);
          if (diff < 0) return 'Invalid date';
          return this.sanitizer.sanitize(
            SecurityContext.HTML,
            this.utils.humanizeDuration(
              moment.duration(moment().diff(params.data.started_at))
            )
          );
        },
        comparator: (value1, value2, node1, node2) =>
          Date.parse(node1.data.started_at) - Date.parse(node2.data.started_at),
        width: 100,
        icons: {
          sortAscending: '<em class="fa fa-sort-numeric-down"/>',
          sortDescending: '<em class="fa fa-sort-numeric-up"/>',
        },
      },
    ];

    let gridOptions = this.utils.createGridOptions(columnDefs, this.$win);
    gridOptions.rowSelection = selectable ? 'multiple' : 'single';
    gridOptions.suppressRowClickSelection = selectable;
    gridOptions.rowClassRules = {
      'disabled-row': function (params) {
        if (!params.data) return true;
        return !!params.data.disable;
      },
    };
    return gridOptions;
  }

  ngOnInit(): void {
    this.gridOptions = this.prepareGrid(this.selectable);
    this.gridOptions = {
      ...this.gridOptions,
      onRowSelected: params => this.onRowSelected(params),
      onGridReady: event => this.onGridReady(event),
      components: {
        statusCellRenderer: EnforcersGridStatusCellComponent,
      },
    };
    this.getEnforcers();

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.resize && this.gridApi) {
      this.onResize();
    }
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.enforcerCount;
  }

  refresh(): void {
    this.refreshing$.next(true);
    this.selectedEnforcerSubject$.next(undefined);
    this.getEnforcers();
  }

  onResize(): void {
    if (this.isVisible) this.gridApi.sizeColumnsToFit();
  }

  setDefaultSelection(): void {
    if (!this.selectable && this.gridApi) {
      this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.onResize();
    this.setDefaultSelection();
  }

  onRowSelected(params: RowSelectedEvent) {
    if (params.node.isSelected()) {
      this.selectedEnforcerSubject$.next(params.data);
      if (this.selectedNodes.length < GlobalConstant.MAX_ENFORCER_LOG) {
        this.selectedNodes.push(params.node);
      } else {
        params.node.setSelected(false);
      }
    } else {
      this.selectedNodes = this.selectedNodes.filter(n => n !== params.node);
    }
  }

  getEnforcers(): void {
    this.enforcersService
      .getEnforcers()
      .pipe(
        finalize(() => this.refreshing$.next(false)),
        map(enforcers => {
          return enforcers.map(enforcer => {
            if (enforcer.version && enforcer.version[0] === 'v') {
              return {
                ...enforcer,
                version: enforcer.version.substring(1),
              };
            }
            return enforcer;
          });
        })
      )
      .subscribe(res => {
        this.enforcersService.enforcers = res;
        this.filteredCount = this.enforcersService.enforcers.length;
      });
  }
}
