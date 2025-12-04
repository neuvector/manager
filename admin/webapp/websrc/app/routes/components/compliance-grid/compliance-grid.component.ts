import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IRowNode,
  ValueFormatterParams,
  PostSortRowsParams,
} from 'ag-grid-community';
import { Check } from '@common/types';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { cloneDeep } from 'lodash';
import { UtilsService } from '@common/utils/app.utils';
import { saveAs } from 'file-saver';
import { ComplianceGridStatusCellComponent } from '@components/compliance-grid/compliance-grid-status-cell/compliance-grid-status-cell.component';
import { ComplianceGridCategoryCellComponent } from '@components/compliance-grid/compliance-grid-category-cell/compliance-grid-category-cell.component';
import { TranslateService } from '@ngx-translate/core';
import {
  arrayToCsv,
  groupBy,
  renameKey,
  uuid,
} from '@common/utils/common.utils';
import { DatePipe } from '@angular/common';
import { ComplianceGridNameCellComponent } from './compliance-grid-name-cell/compliance-grid-name-cell.component';
import { GlobalVariable } from '@common/variables/global.variable';
import * as $ from 'jquery';


export type ComplianceRow = Check & {
  id: string;
  parent_id?: string;
  child_ids?: string[];
  visible: boolean;
};

@Component({
  standalone: false,
  selector: 'app-compliance-grid',
  templateUrl: './compliance-grid.component.html',
  styleUrls: ['./compliance-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class ComplianceGridComponent implements OnInit {
  private readonly $win;
  @Input() path!: string;
  @Input() repository!: string;
  @Input() imageId!: string;
  @Input() baseOS!: string;
  @Input() dockerCisVersion!: string;
  @Input() kubernetesCisVersion!: string;
  @Input() runAt!: string;
  @Input()
  get resize(): boolean {
    return this._resize;
  }
  set resize(resize: boolean) {
    this._resize = resize;
    if (this.gridApi) this.gridApi.sizeColumnsToFit();
  }
  private _resize!: boolean;
  @Input()
  get rowData(): Check[] {
    return this._rowData;
  }
  set rowData(rowData: Check[]) {
    this._rowData = rowData;
    this.displayData = this.formatRows(this.rowData);
    if (this.gridApi) this.gridApi.setGridOption('rowData', this.displayData);
  }
  private _rowData!: Check[];
  displayData!: ComplianceRow[];
  @Input() tableHeight!: string;
  @Input() useQuickFilterService?: boolean;
  @Input() isContainer: boolean = false;
  @Input() includeRemediation: boolean = false;
  @Output() remediation = new EventEmitter<Check>();
  get isEmpty(): boolean {
    return !this.rowData.length;
  }
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'category',
      width: 5,
      cellRenderer: 'categoryCellRenderer',
      cellRendererParams: {
        kubeType: this.kubernetesCisVersion,
      },
      cellClass: ['d-flex', 'align-items-center'],
      cellClassRules: {
        'justify-content-start': params =>
          !params.data.parent_id && !params.data.child_ids,
      },
      headerValueGetter: () =>
        this.translate.instant('event.gridHeader.CATEGORY'),
    },
    {
      field: 'test_number',
      width: 5,
      cellRenderer: 'nameCellRenderer',
      cellRendererParams: {
        includeRemediation: () => this.includeRemediation,
        openRemediation: (data: Check) => this.remediation.emit(data),
      },
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.NAME'),
    },
    {
      field: 'level',
      width: 5,
      cellRenderer: 'statusCellRenderer',
      cellClass: ['d-flex', 'align-items-center'],
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.STATUS'),
    },
    {
      field: 'scored',
      width: 5,
      valueFormatter: this.scoreFormatter,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.SCORED') + '\u00A0\u24D8',
      headerTooltip: this.translate.instant('cis.SCORED'),
    },
    {
      field: 'profile',
      width: 5,
      headerValueGetter: () =>
        this.translate.instant('profile.TITLE') + '\u00A0\u24D8',
      headerTooltip: this.translate.instant('cis.LEVEL1'),
    },
    {
      field: 'description',
      wrapText: true,
      autoHeight: true,
      cellClassRules: {
        'text-muted': params =>
          params.data.child_ids && params.data.child_ids.length > 0,
      },
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.DESC'),
    },
  ];

  constructor(
    private quickFilterService: QuickFilterService,
    private utils: UtilsService,
    private translate: TranslateService,
    private datePipe: DatePipe
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      rowData: this.displayData,
      tooltipShowDelay: 0,
      suppressDragLeaveHidesColumns: true,
      getRowId: params => params.data.id,
      onGridReady: event => this.onGridReady(event),
      postSortRows: this.postSortRows.bind(this),
      isExternalFilterPresent: () => true,
      doesExternalFilterPass: this.isVisible.bind(this),
      components: {
        statusCellRenderer: ComplianceGridStatusCellComponent,
        categoryCellRenderer: ComplianceGridCategoryCellComponent,
        nameCellRenderer: ComplianceGridNameCellComponent,
      },
    };
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    if (this.useQuickFilterService) {
      this.quickFilterService.textInput$.subscribe((value: string) => {
        this.quickFilterService.onFilterChange(
          value,
          this.gridOptions,
          this.gridApi
        );
      });
    }
    this.gridApi.sizeColumnsToFit();
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  postSortRows(params: PostSortRowsParams<any, any>): void {
    let lastParentIdx = -1;
    for (let i = 0; i < params.nodes.length; i++) {
      const pid = params.nodes[i].data.parent_id;
      if (pid) {
        const pidx = params.nodes.findIndex(node => node.data.id === pid);
        if (lastParentIdx !== pidx) {
          params.nodes.splice(pidx + 1, 0, params.nodes.splice(i, 1)[0]);
          if (pidx > i) {
            i--;
          }
        }
      } else {
        lastParentIdx = i;
      }
    }
  }

  isVisible(node: IRowNode): boolean {
    return !node.data.parent_id || node.data.visible;
  }

  formatRows(rowData: Check[]): ComplianceRow[] {
    let complianceRow: ComplianceRow[] = [];
    let groupedData: { [key: string]: Check[] } = groupBy(
      rowData,
      'test_number'
    );
    Object.entries(groupedData).forEach(([k, v]) => {
      let parent = { ...v[0] } as ComplianceRow;
      const parent_id = uuid();
      parent.id = parent_id;
      parent.visible = false;
      if (v.length > 1) {
        let child_ids: string[] = [];
        v.forEach(row => {
          let child = { ...row } as ComplianceRow;
          const child_id = uuid();
          child.id = child_id;
          child.parent_id = parent_id;
          child.visible = false;
          complianceRow.push(child);
          child_ids.push(child_id);
        });
        parent.child_ids = child_ids;
        parent.description = `${v.length} reported entries in the check`;
      }
      complianceRow.push(parent);
    });
    return complianceRow;
  }

  complianceRow2Item(row) {
    delete row.id;
    delete row.parent_id;
    delete row.child_ids;
    delete row.visible;
  }

  getCsvData() {
    if (this.isContainer) {
      let compliance4Csv = [] as any;
      this.gridApi.forEachNodeAfterFilterAndSort(node => {
        compliance4Csv.push(node.data);
      });
      compliance4Csv = JSON.parse(JSON.stringify(compliance4Csv));
      let compliance_ids: string[] = [];
      compliance4Csv = compliance4Csv.flatMap(compliance => {
        let compliances: Check[] = [];
        if (compliance.child_ids && compliance.child_ids.length > 0) {
          compliance.child_ids.forEach(id => {
            const child: ComplianceRow = {
              ...this.gridApi.getRowNode(id)?.data,
            };
            if (!compliance_ids.includes(child.id)) {
              compliance_ids.push(child.id);
              this.complianceRow2Item(child);
              compliances.push(child);
            }
          });
        } else {
          if (!compliance_ids.includes(compliance.id)) {
            compliance_ids.push(compliance.id);
            this.complianceRow2Item(compliance);
            compliances.push(compliance);
          }
        }
        return compliances;
      });
      return compliance4Csv;
    } else {
      return cloneDeep(this.rowData);
    }
  }

  formatCompliance(compliance4Csv) {
    compliance4Csv = compliance4Csv.map(compliance => {
      if (compliance.description) {
        compliance.description = compliance.description.replace(/\"/g, "'");
      }
      if (compliance.remediation) {
        compliance.remediation = compliance.remediation.replace(/\"/g, "'");
      }
      if (compliance.evidence) {
        compliance.evidence = compliance.evidence.replace(/\"/g, "'");
      }
      if (compliance.message) {
        compliance.message = compliance.message.join('\n').replace(/\"/g, "'");
      }
      return compliance;
    });
    if (this.isContainer) {
      compliance4Csv = compliance4Csv.map(compliance => {
        if (compliance.hasOwnProperty('test_number')) {
          renameKey(compliance, 'test_number', 'name', {});
        }
        compliance.description = compliance.message
          ? `${compliance.description}\n${compliance.message}`
          : compliance.description;
        delete compliance.message;
        return compliance;
      });
    }
    return compliance4Csv;
  }

  formatTitle(): string {
    if (this.isContainer) {
      let csvTitle: string[] = [];
      if (this.dockerCisVersion) {
        csvTitle.push(
          `Docker ${this.translate.instant('containers.CIS_VERSION')}: ${
            this.dockerCisVersion
          }`
        );
      }
      if (this.kubernetesCisVersion) {
        csvTitle.push(
          `Kubernetes ${this.translate.instant('containers.CIS_VERSION')}: ${
            this.kubernetesCisVersion
          }`
        );
      }
      if (this.runAt) {
        csvTitle.push(
          `${this.translate.instant(
            'scan.gridHeader.TIME'
          )}: ${this.datePipe.transform(this.runAt, 'MMM dd y HH:mm:ss')}`
        );
      }
      return csvTitle.filter(title => title).join(',');
    } else {
      return `${this.path + this.repository} | Image Id: ${
        this.imageId
      } | OS: ${this.baseOS}`;
    }
  }

  exportCSV(): void {
    let compliance4Csv = this.getCsvData();
    const title = this.formatTitle();
    compliance4Csv = this.formatCompliance(compliance4Csv);
    const complianceCSV = arrayToCsv(compliance4Csv, title);
    const blob = new Blob([complianceCSV], { type: 'text/csv;charset=utf-8' });
    const filename = `compliance-${
      this.path + this.repository
    }_${this.utils.parseDatetimeStr(new Date())}.csv`;
    saveAs(blob, filename);
  }

  scoreFormatter(params: ValueFormatterParams): string {
    return params.data.scored ? 'Y' : 'N';
  }
}
