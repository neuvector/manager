import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { Controller } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { ControllersService } from '@services/controllers.service';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowSelectedEvent,
} from 'ag-grid-community';
import * as moment from 'moment';
import * as $ from 'jquery';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ControllersGridStatusCellComponent } from './controllers-grid-status-cell/controllers-grid-status-cell.component';
import { MultiClusterService } from '@services/multi-cluster.service';
import { finalize, map } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-controllers-grid',
  templateUrl: './controllers-grid.component.html',
  styleUrls: ['./controllers-grid.component.scss'],
})
export class ControllersGridComponent implements OnInit, OnChanges, OnDestroy {
  private readonly $win;
  @Input() gridHeight: number = 200;
  @Input() resize!: boolean;
  @Input() isVisible: boolean = true;
  refreshing$ = new Subject();
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filtered: boolean = false;
  filteredCount!: number;
  selectedControllerSubject$ = new BehaviorSubject<Controller | undefined>(
    undefined
  );
  selectedController: Observable<Controller | undefined> =
    this.selectedControllerSubject$.asObservable();
  get controllerCount() {
    return this.controllersService.controllers.length;
  }
  private switchClusterSubscription;
  columnDefs: ColDef[] = [
    {
      headerName: this.tr.instant('controllers.detail.NAME'),
      field: 'display_name',
      minWidth: 300,
    },
    {
      headerName: this.tr.instant('controllers.detail.CLUSTER_IP'),
      field: 'cluster_ip',
    },
    {
      headerName: this.tr.instant('controllers.detail.STATUS'),
      field: 'connection_state',
      cellRenderer: 'statusCellRenderer',
      width: 90,
    },
    {
      headerName: this.tr.instant('controllers.detail.VERSION'),
      field: 'version',
    },
    {
      headerName: this.tr.instant('controllers.detail.LEADER'),
      field: 'leader',
      cellRenderer: params => {
        if (params.value)
          return '<em class="fa fa-flag-checkered text-success fa-lg"></em>';
        else return null;
      },
      width: 80,
      maxWidth: 100,
    },
    {
      headerName: this.tr.instant('controllers.detail.DURATION'),
      cellRenderer: params => {
        return this.utils.humanizeDuration(
          moment.duration(moment().diff(params.data.started_at))
        );
      },
      comparator: (value1, value2, node1, node2) => {
        return (
          Date.parse(node1.data.started_at) - Date.parse(node2.data.started_at)
        );
      },
      width: 120,
      maxWidth: 160,
      icons: {
        sortAscending: '<em class="fa fa-sort-numeric-down"/>',
        sortDescending: '<em class="fa fa-sort-numeric-up"/>',
      },
    },
  ];

  constructor(
    public controllersService: ControllersService,
    private tr: TranslateService,
    private utils: UtilsService,
    private multiClusterService: MultiClusterService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      onRowSelected: params => this.onRowSelected(params),
      onGridReady: event => this.onGridReady(event),
      components: {
        statusCellRenderer: ControllersGridStatusCellComponent,
      },
    };
    this.getControllers();
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
    this.filtered = this.filteredCount !== this.controllerCount;
  }

  refresh(): void {
    this.refreshing$.next(true);
    this.selectedControllerSubject$.next(undefined);
    this.getControllers();
  }

  onResize(): void {
    if (this.isVisible) this.gridApi.sizeColumnsToFit();
  }

  setDefaultSelection(): void {
    if (this.gridApi) {
      this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
    }
  }

  onRowSelected(params: RowSelectedEvent) {
    if (params.node.isSelected()) {
      this.selectedControllerSubject$.next(params.data);
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.onResize();
    this.setDefaultSelection();
  }

  getControllers(): void {
    this.controllersService
      .getControllers()
      .pipe(
        finalize(() => this.refreshing$.next(false)),
        map(controllers => {
          return controllers.map(controller => {
            if (controller.version && controller.version[0] === 'v') {
              return {
                ...controller,
                version: controller.version.substring(1),
              };
            }
            return controller;
          });
        })
      )
      .subscribe(res => {
        this.controllersService.controllers = res;
        this.filteredCount = this.controllersService.controllers.length;
      });
  }
}
