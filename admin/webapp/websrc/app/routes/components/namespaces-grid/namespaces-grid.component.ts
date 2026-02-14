import { Component, Input, OnInit } from '@angular/core';
import { Domain } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { NamespacesService } from '@services/namespaces.service';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowDataUpdatedEvent,
  RowSelectedEvent,
} from 'ag-grid-community';
import { BehaviorSubject, Observable } from 'rxjs';
import { DomainNameCellComponent } from '@routes/namespaces/namespace-items/domain-name-cell/domain-name-cell.component';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-namespaces-grid',
  templateUrl: './namespaces-grid.component.html',
  styleUrls: ['./namespaces-grid.component.scss'],
})
export class NamespacesGridComponent implements OnInit {
  private readonly $win;
  @Input() gridHeight: number = 200;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filtered: boolean = false;
  filteredCount!: number;
  selectedNamespaceSubject$ = new BehaviorSubject<Domain | undefined>(
    undefined
  );
  namespaceBoundaryDisplayName = GlobalConstant.Namespace_Boundary_Enabled;
  hasNamespaceBoundaryEnabled: boolean = false;
  selectedNamespace$: Observable<Domain | undefined> =
    this.selectedNamespaceSubject$.asObservable();
  get domainsCount() {
    return this.namespacesService.namespaces.length;
  }
  columnDefs: ColDef[] = [
    {
      field: 'name',
      cellRenderer: 'nameCellRenderer',
      headerValueGetter: () => this.tr.instant('cis.report.gridHeader.NAME'),
    },
    {
      field: 'workloads',
      headerValueGetter: () =>
        this.tr.instant('namespaces.gridHeader.TOTAL_WORKLOAD'),
      icons: {
        sortAscending: '<em class="fa fa-sort-amount-down"></em>',
        sortDescending: '<em class="fa fa-sort-amount-up"></em>',
      },
      width: 120,
    },
    {
      field: 'running_workloads',
      headerValueGetter: () =>
        this.tr.instant('namespaces.gridHeader.RUNNING_WORKLOADS'),
      icons: {
        sortAscending: '<em class="fa fa-sort-amount-down"></em>',
        sortDescending: '<em class="fa fa-sort-amount-up"></em>',
      },
      width: 120,
    },
    {
      field: 'running_pods',
      headerValueGetter: () =>
        this.tr.instant('namespaces.gridHeader.RUNNING_PODS'),
      icons: {
        sortAscending: '<em class="fa fa-sort-amount-down"></em>',
        sortDescending: '<em class="fa fa-sort-amount-up"></em>',
      },
      width: 120,
    },
    {
      field: 'services',
      headerValueGetter: () =>
        this.tr.instant('namespaces.gridHeader.SERVICES'),
      icons: {
        sortAscending: '<em class="fa fa-sort-amount-down"></em>',
        sortDescending: '<em class="fa fa-sort-amount-up"></em>',
      },
      width: 70,
    },
  ];

  constructor(
    public namespacesService: NamespacesService,
    private utils: UtilsService,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      getRowId: params => params.data.name,
      onGridReady: this.onGridReady.bind(this),
      onRowSelected: this.onRowSelected.bind(this),
      onRowDataUpdated: this.onRowDataUpdated.bind(this),
      components: {
        nameCellRenderer: DomainNameCellComponent,
      },
    };
    this.hasNamespaceBoundaryEnabled = this.namespacesService.namespaces.some(
      data => data.nbe
    );
  }
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
  }

  onRowSelected(params: RowSelectedEvent) {
    if (params.node.isSelected()) {
      this.selectedNamespaceSubject$.next(params.data);
    }
  }

  onRowDataUpdated(event: RowDataUpdatedEvent) {
    const selected = this.selectedNamespaceSubject$.value,
      platform = selected
        ? event.api.getRowNode(selected.name)
        : event.api.getDisplayedRowAtIndex(0);
    platform?.setSelected(true);
    setTimeout(() => {
      this.gridApi.ensureNodeVisible(platform, 'middle');
    }, 200);
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.domainsCount;
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }
}
