import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Domain } from '@common/types';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ActionCellComponent } from '@routes/compliance-profile/compliance-profile-templates/compliance-profile-templates-table/action-cell/action-cell.component';
import { cloneDeep } from 'lodash';
import { TemplatesCellComponent } from '@routes/compliance-profile/compliance-profile-assets/compliance-profile-assets-table/templates-cell/templates-cell.component';
import { ComplianceProfileService } from '@routes/compliance-profile/compliance-profile.service';
import { EditTemplateDialogComponent } from '@routes/compliance-profile/compliance-profile-assets/compliance-profile-assets-table/edit-template-dialog/edit-template-dialog.component';
import { AuthUtilsService } from '@common/utils/auth.utils';


export const iconMap = {
  _images: 'fa fa-archive',
  _nodes: 'fa fa-server',
  _containers: 'far fa-square',
};

@Component({
  standalone: false,
  selector: 'app-compliance-profile-assets-table',
  templateUrl: './compliance-profile-assets-table.component.html',
  styleUrls: ['./compliance-profile-assets-table.component.scss'],
  
})
export class ComplianceProfileAssetsTableComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() rowData!: Domain[];
  @Input() imageTags!: string[];
  @Input() nodeTags!: string[];
  @Input() containerTags!: string[];
  @Input() namespaceEnabled: boolean = false;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  isWriteComplianceProfileAuthorized: boolean = false;

  columnDefs!: ColDef[];

  constructor(
    private translate: TranslateService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private complianceProfileService: ComplianceProfileService,
    private authUtilsService: AuthUtilsService
  ) {}

  setGrid() {
    this.columnDefs = [
      {
        field: 'name',
        sortable: true,
        resizable: true,
        headerValueGetter: () =>
          this.translate.instant('cis.report.gridHeader.NAME'),
      },
      {
        field: 'tags',
        width: 120,
        sortable: true,
        resizable: true,
        cellRenderer: 'templatesCellRenderer',
        headerValueGetter: () =>
          this.translate.instant('cis.profile.TEMPLATES'),
      },
      {
        field: 'workloads',
        width: 120,
        sortable: true,
        resizable: true,
        headerValueGetter: () =>
          this.translate.instant('multiCluster.summary.TOTAL_WORKLOAD'),
      },
      {
        field: 'running_pods',
        width: 120,
        sortable: true,
        resizable: true,
        headerValueGetter: () =>
          this.translate.instant('multiCluster.summary.RUNNING_POD'),
      },
      {
        field: 'services',
        width: 70,
        sortable: true,
        resizable: true,
        headerValueGetter: () =>
          this.translate.instant('dashboard.summary.SERVICE'),
      },
      {
        field: 'action',
        resizable: true,
        width: 50,
        cellRenderer: 'actionCellRenderer',
        hide:
          !this.namespaceEnabled || !this.isWriteComplianceProfileAuthorized,
        cellRendererParams: {
          edit: event => this.editTemplateFromGrid(event),
        },
        headerValueGetter: () => this.translate.instant('setting.ACTIONS'),
      },
    ];
  }

  ngOnInit(): void {
    this.isWriteComplianceProfileAuthorized =
      this.authUtilsService.getDisplayFlag('write_compliance_profile');
    this.setGrid();
    this.gridOptions = {
      rowData: this.rowData,
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      onGridReady: event => this.onGridReady(event),
      components: {
        templatesCellRenderer: TemplatesCellComponent,
        actionCellRenderer: ActionCellComponent,
      },
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    } as GridOptions;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.gridApi) {
      if (changes.rowData) {
        this.gridApi.setGridOption('rowData', changes.rowData.currentValue);
      }
      if (changes.namespaceEnabled && this.gridOptions) {
        this.toggleNamespaceActions();
      }
    }
  }

  editTemplateFromGrid(event): void {
    this.openDialog(
      cloneDeep(this.gridApi.getRowNode(event.node.id)?.data),
      event.node.id
    );
  }

  editTemplate(name: string) {
    let tags;
    if (name === '_images') {
      tags = [...this.imageTags];
    } else if (name === '_nodes') {
      tags = [...this.nodeTags];
    } else if (name === '_containers') {
      tags = [...this.containerTags];
    }

    const data = {
      name,
      tags,
    };
    this.openDialog(data, undefined, name);
  }

  openDialog(data, id?: string, name?: string): void {
    const dialog = this.dialog.open(EditTemplateDialogComponent, {
      width: '100%',
      maxWidth: '500px',
      data,
    });
    dialog.afterClosed().subscribe(dialogData => {
      if (id && dialogData) {
        const rowNode = this.gridApi.getRowNode(id);
        const newData = rowNode!.data;
        newData.tags = dialogData;
        rowNode?.updateData(newData);
        this.cd.markForCheck();
      }
      if (name && dialogData) {
        if (name === '_images') {
          this.imageTags = dialogData;
        } else if (name === '_nodes') {
          this.nodeTags = dialogData;
        } else if (name === '_containers') {
          this.containerTags = dialogData;
        }
      }
    });
  }

  ngAfterViewInit() {
    this.complianceProfileService.resize$.subscribe(() => {
      if (this.gridApi) {
        this.gridApi.sizeColumnsToFit();
        this.cd.markForCheck();
      }
    });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.forEachNode(node =>
      node.rowIndex ? 0 : node.setSelected(true)
    );
    this.cd.markForCheck();
  }

  toggleNamespaceActions() {
    if (this.namespaceEnabled && this.isWriteComplianceProfileAuthorized) {
      this.gridApi?.setColumnsVisible(['action'], true);
    } else {
      this.gridApi?.setColumnsVisible(['action'], false);
    }
    this.gridApi.sizeColumnsToFit();
    this.cd.markForCheck();
  }

  enable() {
    this.toggleNamespaceActions();
    this.complianceProfileService
      .toggleDomainTagging({
        tag_per_domain: this.namespaceEnabled,
      })
      .subscribe(() => {});
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }
}
