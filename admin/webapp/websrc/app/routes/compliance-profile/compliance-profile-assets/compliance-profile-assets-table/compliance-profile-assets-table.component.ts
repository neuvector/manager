import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
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

@Component({
  selector: 'app-compliance-profile-assets-table',
  templateUrl: './compliance-profile-assets-table.component.html',
  styleUrls: ['./compliance-profile-assets-table.component.scss'],
})
export class ComplianceProfileAssetsTableComponent
  implements OnInit, AfterViewInit
{
  @Input() rowData!: Domain[];
  @Input() imageTags!: string[];
  @Input() nodeTags!: string[];
  @Input() containerTags!: string[];
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  namespaceEnabled = false;
  isWriteComplianceProfileAuthorized: boolean;
  // name: string;
  // running_pods: number;
  // running_workloads: number;
  // services: number;
  // tags: string[];
  // workloads: number;

  columnDefs: ColDef[] = [
    {
      field: 'name',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.NAME'),
    },
    {
      field: 'tags',
      width: 180,
      sortable: true,
      resizable: true,
      cellRenderer: 'templatesCellRenderer',
      headerValueGetter: () => this.translate.instant('cis.profile.TEMPLATES'),
    },
    {
      field: 'workloads',
      width: 70,
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.CATEGORY'),
    },
    {
      field: 'running_pods',
      width: 50,
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.SCORED'),
    },
    {
      field: 'running_workloads',
      width: 70,
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.PROFILE'),
    },
    {
      field: 'action',
      resizable: true,
      width: 50,
      cellRenderer: 'actionCellRenderer',
      hide: true,
      cellRendererParams: {
        edit: event => this.editTemplateFromGrid(event),
      },
      headerValueGetter: () => this.translate.instant('setting.ACTIONS'),
    },
  ];

  constructor(
    private translate: TranslateService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private complianceProfileService: ComplianceProfileService,
    private authUtilsService: AuthUtilsService
  ) {}

  ngOnInit(): void {
    this.isWriteComplianceProfileAuthorized = this.authUtilsService.getDisplayFlag('write_compliance_profile');
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
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS')
    };
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

  enable() {
    if (this.namespaceEnabled) {
      this.gridOptions.columnApi?.setColumnVisible('action', true);
    } else {
      this.gridOptions.columnApi?.setColumnVisible('action', false);
    }
    this.gridApi.sizeColumnsToFit();
    this.cd.markForCheck();
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }
}
