import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { ModuleVulnerabilitiesCellComponent } from './module-vulnerabilities-cell/module-vulnerabilities-cell.component';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-modules-table',
  templateUrl: './modules-table.component.html',
  styleUrls: ['./modules-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModulesTableComponent implements OnInit, OnChanges {
  @Output() moduleSelected = new EventEmitter();
  @Input() resize?: boolean;
  @Input() rowData;
  @Input() hideSafeModules = true;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'name',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.NAME'),
    },
    {
      field: 'source',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.SOURCE'),
    },
    {
      field: 'version',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.VERSION'),
    },
    {
      field: 'vulnerabilities',
      sortable: true,
      resizable: true,
      comparator: (valueA, valueB, nodeA, nodeB) => {
        return this.compare(
          nodeA.data.cves?.length || 0,
          nodeB.data.cves?.length || 0
        );
      },
      cellRenderer: 'statusCellRenderer',
      headerValueGetter: () => 'Vulnerabilities',
    },
  ];

  constructor(
    private quickFilterService: QuickFilterService,
    private translate: TranslateService
  ) {}

  compare(a, b): number {
    {
      if (a === b) {
        return 0;
      }
      return a > b ? 1 : -1;
    }
  }

  ngOnInit(): void {
    this.gridOptions = {
      rowData: this.filterRows(this.rowData, this.hideSafeModules),
      columnDefs: this.columnDefs,
      rowSelection: 'single',
      suppressDragLeaveHidesColumns: true,
      onGridReady: event => this.onGridReady(event),
      onSelectionChanged: event => this.onSelectionChanged(event),
      components: { statusCellRenderer: ModuleVulnerabilitiesCellComponent },
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
  }

  onSelectionChanged(params: GridReadyEvent): void {
    const data = params.api.getSelectedNodes()[0]?.data;
    if (data) this.moduleSelected.emit(data);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.resize && this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
    if (changes.hideSafeModules && this.gridApi) {
      this.gridApi.setGridOption(
        'rowData',
        this.filterRows(this.rowData, changes.hideSafeModules.currentValue)
      );
    }
  }

  filterRows(rowData: any, hideSafeModules: boolean) {
    return hideSafeModules
      ? rowData.slice().filter(module => module.cves && module.cves.length > 0)
      : rowData.slice();
  }

  onGridReady(params: GridReadyEvent): void {
    params.api.applyColumnState({
      state: [
        {
          colId: 'vulnerabilities',
          sort: 'desc',
        },
      ],
    });
    this.gridApi = params.api;
    this.quickFilterService.textInput$.subscribe((value: string) => {
      this.quickFilterService.onFilterChange(
        value,
        this.gridOptions,
        this.gridApi
      );
    });
    this.gridApi.sizeColumnsToFit();
    this.gridApi.forEachNode(node =>
      node.rowIndex ? 0 : node.setSelected(true)
    );
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }
}
