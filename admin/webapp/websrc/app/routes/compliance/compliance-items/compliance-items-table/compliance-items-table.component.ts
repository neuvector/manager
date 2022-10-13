import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Compliance } from '@common/types';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowNode,
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
  selector: 'app-compliance-items-table',
  templateUrl: './compliance-items-table.component.html',
  styleUrls: ['./compliance-items-table.component.scss'],
})
export class ComplianceItemsTableComponent implements OnInit, OnDestroy {
  @Input() rowData!: Compliance[];
  @Input() gridHeight!: number;
  @Input() domains!: string[];
  @Output() toggleChartView = new EventEmitter();
  matchTypes = this.complianceFilterService.matchTypes;
  filteredCount = 0;
  filtered$ = this.complianceFilterService.filtered$;
  advFilter: any = this.complianceFilterService.advFilter;
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
      rowData: this.rowData,
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      onGridReady: event => this.onGridReady(event),
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

  doesExternalFilterPass(node: RowNode) {
    if (!this.complianceFilterService.isAdvFilterOn()) return true;
    else {
      let result = true;
      if (
        !this.advFilter.category.custom ||
        !this.advFilter.category.docker ||
        !this.advFilter.category.kubernetes ||
        !this.advFilter.category.image
      ) {
        if (!this.advFilter.category.docker)
          result = result && node.data.category !== 'docker';
        if (!this.advFilter.category.custom)
          result = result && node.data.category !== 'custom';
        if (!this.advFilter.category.kubernetes)
          result = result && node.data.category !== 'kubernetes';
        if (!this.advFilter.category.image)
          result = result && node.data.category !== 'image';
      }
      if (
        this.advFilter.tags.gdpr ||
        this.advFilter.tags.hipaa ||
        this.advFilter.tags.nist ||
        this.advFilter.tags.pci
      ) {
        if (node.data.tags && node.data.tags.length > 0) {
          if (this.advFilter.tags.gdpr)
            result = result && node.data.tags.includes('GDPR');
          if (this.advFilter.tags.hipaa)
            result = result && node.data.tags.includes('HIPAA');
          if (this.advFilter.tags.nist)
            result = result && node.data.tags.includes('NIST');
          if (this.advFilter.tags.pci)
            result = result && node.data.tags.includes('PCI');
        } else return false;
      }
      if (this.advFilter.scoredType !== 'all') {
        result =
          result && node.data.scored.toString() === this.advFilter.scoredType;
      }
      if (this.advFilter.profileType !== 'all') {
        result = result && node.data.profile === this.advFilter.profileType;
      }
      if (this.advFilter.containerName) {
        if (node.data.workloads.length) {
          result = this.checkEntity(
            this.advFilter.matchTypes['Container'].id,
            node.data.workloads,
            this.advFilter.containerName,
            result
          );
        } else return false;
      }
      if (this.advFilter.nodeName) {
        if (node.data.nodes.length) {
          result = this.checkEntity(
            this.advFilter.matchTypes['Node'].id,
            node.data.nodes,
            this.advFilter.nodeName,
            result
          );
        } else return false;
      }
      if (this.advFilter.imageName) {
        if (node.data.images.length) {
          result = this.checkEntity(
            this.advFilter.matchTypes['Image'].id,
            node.data.images,
            this.advFilter.imageName,
            result
          );
        } else return false;
      }
      if (this.advFilter.selectedDomains.length) {
        result = this.checkEntity(
          this.advFilter.matchType4Ns.id,
          node.data.domains,
          this.advFilter.selectedDomains.join(','),
          result
        );
      }
      if (this.advFilter.serviceName) {
        if (node.data.services.length) {
          result = this.checkEntity(
            this.advFilter.matchTypes['Service'].id,
            node.data.services,
            this.advFilter.serviceName,
            result
          );
        } else return false;
      }

      return result;
    }
  }

  checkEntity(matchType, entities, pattern, result) {
    const patterns = pattern.split(',').map(item => item.trim());
    const theEntity = entities.find(entity => {
      if (entity && entity.display_name) {
        if (matchType === 'equal')
          return patterns.some(item => item === entity.display_name);
        else return new RegExp(patterns.join('|')).test(entity.display_name);
      } else {
        if (matchType === 'equal')
          return patterns.some(item => item === entity);
        else return new RegExp(patterns.join('|')).test(entity);
      }
    });
    result = result && !!theEntity;
    return result;
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.complianceFilterService.filtered =
      this.filteredCount !== this.rowData.length;
    this.runWorkers();
  }

  onSelectionChanged(params: GridReadyEvent): void {
    this.toggleChartView.emit(false);
    this.complianceService.selectCompliance(
      params.api.getSelectedNodes()[0].data
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.gridApi && changes.rowData) {
      this.gridApi.setRowData(changes.rowData.currentValue);
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.forEachNode(node =>
      node.rowIndex ? 0 : node.setSelected(true)
    );
    this.cd.markForCheck();
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  setAdvancedFilter(filter?: any) {
    if (filter) {
      this.complianceFilterService.advFilter = filter;
    }
    this.advFilter = this.complianceFilterService.advFilter;
    this.gridApi.onFilterChanged();
    this.filteredCount =
      this.gridApi.getModel()['rootNode'].childrenAfterFilter.length;
    this.runWorkers();
  }

  openAdvancedFilter(): void {
    if (!this.filterOpen) {
      this.filterOpen = true;
      this.filterDialog = this.dialog.open(
        ComplianceItemsTableFilterComponent,
        {
          width: '675px',
          data: { filter: this.advFilter, domains: this.domains },
          hasBackdrop: false,
          position: { right: '25px', top: '130px' },
        }
      );

      const convertMatchType = id => {
        return id === 'equal' ? this.matchTypes[0] : this.matchTypes[1];
      };

      this.filterDialog.afterClosed().subscribe(filter => {
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

  runWorkers() {
    const filteredCis: any = [];
    this.gridApi.forEachNodeAfterFilterAndSort(node => {
      filteredCis.push(JSON.parse(JSON.stringify(node.data)));
    });
    this.complianceFilterService.filteredCis = filteredCis;
    this.complianceService.runWorkers();
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
