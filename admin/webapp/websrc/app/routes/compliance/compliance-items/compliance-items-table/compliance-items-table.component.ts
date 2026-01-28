import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { Compliance } from '@common/types';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowDataUpdatedEvent,
  IRowNode,
} from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { ComplianceItemsTableStatusCellComponent } from './compliance-items-table-status-cell/compliance-items-table-status-cell.component';
import { ComplianceGridCategoryCellComponent } from '@components/compliance-grid/compliance-grid-category-cell/compliance-grid-category-cell.component';
import { ComplianceItemsTableCsvCellComponent } from './compliance-items-table-csv-cell/compliance-items-table-csv-cell.component';
import { ComplianceItemsTableImpactCellComponent } from './compliance-items-table-impact-cell/compliance-items-table-impact-cell.component';
import { ComplianceService } from '../../compliance.service';
import { ComplianceFilterService } from '../../compliance.filter.service';
import { ComplianceItemsTableFilterComponent } from './compliance-items-table-filter/compliance-items-table-filter.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone: false,
  selector: 'app-compliance-items-table',
  templateUrl: './compliance-items-table.component.html',
  styleUrls: ['./compliance-items-table.component.scss'],
})
export class ComplianceItemsTableComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() rowData!: Compliance[];
  @Input() gridHeight!: number;
  @Input() domains!: string[];
  @Output() toggleChartView = new EventEmitter();
  @Output() updateCountDistribution = new EventEmitter();
  matchTypes = this.complianceFilterService.matchTypes;
  filteredCount = 0;
  filtered$ = this.complianceFilterService.filtered$;
  filterDialog!: MatDialogRef<any>;
  filterOpen = false;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'category',
      sortable: true,
      resizable: true,
      cellRenderer: 'categoryCellRenderer',
      cellRendererParams: {
        kubeType: this.complianceService.kubeVersion,
      },
      cellClass: ['d-flex', 'align-items-center'],
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.CATEGORY'),
    },
    {
      field: 'name',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.NAME'),
    },
    {
      field: 'level',
      sortable: true,
      resizable: true,
      cellRenderer: 'statusCellRenderer',
      headerValueGetter: () =>
        this.translate.instant('responsePolicy.gridHeader.STATUS'),
    },
    {
      field: 'scored',
      sortable: true,
      resizable: true,
      valueFormatter: params => (params?.node?.data.scored ? 'Y' : 'N'),
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.SCORED'),
    },
    {
      field: 'profile',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.PROFILE'),
    },
    {
      sortable: true,
      resizable: true,
      comparator: this.impactComparator,
      cellRenderer: 'impactCellRenderer',
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.IMPACT'),
    },
    {
      resizable: true,
      cellRenderer: 'csvCellRenderer',
      headerValueGetter: () => 'CSV',
    },
  ];

  constructor(
    private translate: TranslateService,
    private complianceService: ComplianceService,
    private cd: ChangeDetectorRef,
    private complianceFilterService: ComplianceFilterService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.gridOptions = {
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      onGridReady: event => this.onGridReady(event),
      onRowDataUpdated: event => this.onRowDataUpdated(event),
      onSelectionChanged: event => this.onSelectionChanged(event),
      components: {
        impactCellRenderer: ComplianceItemsTableImpactCellComponent,
        csvCellRenderer: ComplianceItemsTableCsvCellComponent,
        categoryCellRenderer: ComplianceGridCategoryCellComponent,
        statusCellRenderer: ComplianceItemsTableStatusCellComponent,
      },
      doesExternalFilterPass: this.doesExternalFilterPass.bind(this),
      isExternalFilterPresent: this.isExternalFilterPresent.bind(this),
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
  }

  onToggleChartView() {
    this.toggleChartView.emit();
  }

  doesExternalFilterPass(node: IRowNode) {
    if (!this.complianceFilterService.isAdvFilterOn()) return true;
    else {
      return this.complianceFilterService.filterFn(node.data);
    }
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.complianceFilterService.filteredCount = results;
    this.complianceFilterService.filtered =
      this.filteredCount !== this.rowData.length;
    this.updateFiltered();
  }

  onSelectionChanged(params: GridReadyEvent): void {
    this.toggleChartView.emit(false);
    this.complianceService.selectCompliance(
      params.api.getSelectedNodes()[0].data
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.gridApi && changes.rowData) {
      this.gridApi.setGridOption('rowData', changes.rowData.currentValue);
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.complianceService.gridApi = this.gridApi;
    this.rowData = this.rowData.map(compliance => {
      compliance.filteredImages = compliance.images;
      compliance.filteredWorkloads = compliance.workloads;
      return compliance;
    });
    setTimeout(() => {
      this.gridApi.setGridOption('rowData', this.rowData);
      this.gridApi.sizeColumnsToFit();
      this.gridApi.forEachNode(node =>
        node.rowIndex ? 0 : node.setSelected(true)
      );
      this.cd.markForCheck();
    }, 200);
  }

  onRowDataUpdated(event: RowDataUpdatedEvent) {
    if (this.complianceFilterService.isAdvFilterOn()) {
      event.api.onFilterChanged();
      this.filteredCount =
        event.api.getModel()['rootNode'].childrenAfterFilter.length;
    }
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  setAdvancedFilter(filter?: any) {
    if (filter) {
      this.complianceFilterService.advFilter = filter;
    }
    this.gridApi.onFilterChanged();
    this.filteredCount =
      this.gridApi.getModel()['rootNode'].childrenAfterFilter.length;
    this.complianceFilterService.filteredCount = this.filteredCount;
    this.updateFiltered();
  }

  openAdvancedFilter(): void {
    if (!this.filterOpen) {
      this.filterOpen = true;
      this.filterDialog = this.dialog.open(
        ComplianceItemsTableFilterComponent,
        {
          width: '700px',
          data: {
            filter: this.complianceFilterService.advFilter,
            domains: this.domains,
          },
          hasBackdrop: false,
          position: { right: '25px', top: '130px' },
        }
      );

      const convertMatchType = id => {
        return id === 'equal' ? this.matchTypes[0] : this.matchTypes[1];
      };

      this.filterDialog.afterClosed().subscribe(filter => {
        this.rowData = this.rowData.map(compliance => {
          compliance.filteredImages = compliance.images;
          compliance.filteredWorkloads = compliance.workloads;
          return compliance;
        });
        if (filter && filter.reset) {
          this.complianceFilterService.resetFilter();
          this.setAdvancedFilter();
        } else if (filter) {
          filter.matchType4Ns = convertMatchType(filter.matchType4Ns);
          filter.matchTypes.Service = convertMatchType(
            filter.matchTypes.Service
          );
          filter.matchTypes.Container = convertMatchType(
            filter.matchTypes.Container
          );
          filter.matchTypes.Node = convertMatchType(filter.matchTypes.Node);
          filter.matchTypes.Image = convertMatchType(filter.matchTypes.Image);
          this.setAdvancedFilter(filter);
        }
        this.filterOpen = false;
      });
    }
  }

  updateFiltered() {
    const filteredCis: any = [];
    this.gridApi.forEachNodeAfterFilterAndSort(node => {
      filteredCis.push(JSON.parse(JSON.stringify(node.data)));
    });
    this.complianceFilterService.filteredCis = filteredCis;
    this.updateCountDistribution.emit(this.complianceFilterService.filteredCis);
  }

  isExternalFilterPresent(): boolean {
    return this.complianceFilterService.isAdvFilterOn();
  }

  ngOnDestroy() {
    if (this.filterOpen) {
      this.filterDialog.close();
    }
  }

  private impactComparator(value1, value2, node1, node2) {
    const cve1 = node1.data;
    const cve2 = node2.data;
    if (cve1.platforms.length === cve2.platforms.length) {
      if (cve1.images.length === cve2.images.length) {
        if (cve1.nodes.length === cve2.nodes.length) {
          return cve1.workloads.length - cve2.workloads.length;
        } else return cve1.nodes.length - cve2.nodes.length;
      } else return cve1.images.length - cve2.images.length;
    } else {
      return cve1.platforms.length - cve2.platforms.length;
    }
  }
}
