import {
  Component,
  Input,
  Output,
  OnChanges,
  OnInit,
  SimpleChanges,
  EventEmitter,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { GridOptions, GridApi } from 'ag-grid-community';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import { MatDialog } from '@angular/material/dialog';
import { FileAccessRulesService } from '@services/file-access-rules.service';
import { AddEditFileAccessRuleModalComponent } from './partial/add-edit-file-access-rule-modal/add-edit-file-access-rule-modal.component';
import { PredefinedFileAccessRulesModalComponent } from './partial/predefined-file-access-rules-modal/predefined-file-access-rules-modal.component';
import { GlobalVariable } from '@common/variables/global.variable';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { switchMap } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { updateGridData } from '@common/utils/common.utils';
import * as $ from 'jquery';

@Component({
  standalone: false,
  selector: 'app-file-access-rules',
  templateUrl: './file-access-rules.component.html',
  styleUrls: ['./file-access-rules.component.scss'],
})
export class FileAccessRulesComponent implements OnInit, OnChanges {
  @Input() isScoreImprovement: boolean = false;
  @Input() source!: string;
  @Input() groupName: string = '';
  @Input() resizableHeight!: number;
  @Input() cfgType!: string;
  @Input() useQuickFilterService: boolean = false;
  @Output() getSelectedFileAccessRules = new EventEmitter();
  @Output() getRemoveProfile = new EventEmitter();
  @Output() getEditProfile = new EventEmitter();
  @Output() getAddProfile = new EventEmitter();
  @Output() getShowPredefinedRules = new EventEmitter();
  private isModalOpen: boolean = false;
  private fileAccessRuleErr: boolean = false;
  public groups: Set<string> = new Set();
  public gridHeight: number = 0;
  public gridOptions!: GridOptions;
  public gridApi!: GridApi;
  public fileAccessRules: Array<any> = [];
  public selectedFileAccessRules;
  public navSource = GlobalConstant.NAV_SOURCE;
  private w: any;
  public globalConstant4Html = GlobalConstant;
  public groupSelection = new FormControl('All', [Validators.required]);
  public filteredCount: number = 0;
  public isWriteGroupAuthorized: boolean = false;
  public isWriteFileAccessRuleAuthorized: boolean = false;
  CFG_TYPE = GlobalConstant.CFG_TYPE;

  constructor(
    private fileAccessRulesService: FileAccessRulesService,
    private authUtilsService: AuthUtilsService,
    private translate: TranslateService,
    private utils: UtilsService,
    private dialog: MatDialog,
    private quickFilterService: QuickFilterService,
    private notificationService: NotificationService
  ) {
    this.w = GlobalVariable.window;
  }

  ngOnInit(): void {
    console.log('on file access rules init: ', this.source, this.cfgType);
    this.source = this.source ? this.source : GlobalConstant.NAV_SOURCE.SELF;
    this.isWriteGroupAuthorized =
      this.authUtilsService.getDisplayFlag('write_group') &&
      (this.source !== GlobalConstant.NAV_SOURCE.GROUP
        ? this.authUtilsService.getDisplayFlag('multi_cluster')
        : true);
    this.isWriteFileAccessRuleAuthorized =
      (this.source === GlobalConstant.NAV_SOURCE.GROUP &&
        (this.cfgType === GlobalConstant.CFG_TYPE.CUSTOMER ||
          this.cfgType === GlobalConstant.CFG_TYPE.LEARNED)) ||
      (this.source === GlobalConstant.NAV_SOURCE.FED_POLICY &&
        this.cfgType === GlobalConstant.CFG_TYPE.FED &&
        this.authUtilsService.getDisplayFlag('multi_cluster_w'));
    this.gridOptions = this.fileAccessRulesService.prepareGrid(
      this.isWriteGroupAuthorized,
      this.source,
      this.isScoreImprovement
    ).gridOptions4fileAccessRules;
    this.gridOptions.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi = params.api;
      }
      setTimeout(() => {
        if (params && params.api) {
          if (this.useQuickFilterService) {
            this.quickFilterService.textInput$.subscribe((value: string) => {
              this.quickFilterService.onFilterChange(
                value,
                this.gridOptions,
                this.gridApi
              );
            });
          }
          params.api.sizeColumnsToFit();
        }
      }, 300);
      $win.on(GlobalConstant.AG_GRID_RESIZE, () => {
        setTimeout(() => {
          if (params && params.api) {
            params.api.sizeColumnsToFit();
          }
        }, 100);
      });
    };
    this.gridOptions.onSelectionChanged = () => {
      this.onSelectionChanged4File();
    };
    this.getFileAccessRules(this.groupName);
    this.groups.add('All');
    this.emitObjects();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
    if (
      changes.groupName &&
      changes.groupName.previousValue &&
      changes.groupName.previousValue !== changes.groupName.currentValue
    ) {
      this.getFileAccessRules(this.groupName);
    }
    this.emitObjects();
  }

  getFileAccessRules = groupName => {
    this.selectedFileAccessRules = null;
    if (this.gridOptions) {
      this.gridOptions.overlayNoRowsTemplate = `<span class="overlay">${this.translate.instant(
        'general.NO_ROWS'
      )}</span>`;
    }
    if (groupName !== GlobalConstant.EXTERNAL) {
      this.fileAccessRulesService.getFileAccessRulesData(groupName).subscribe(
        response => {
          let fileAccessRulesData: Array<any> = [];
          if (groupName === '') {
            fileAccessRulesData = response['profiles'];
            let profiles = fileAccessRulesData.flatMap(profile => {
              if (profile.filters.length > 0) {
                this.groups.add(profile.group);
              }
              return profile.filters.map(filter => {
                return Object.assign(filter, { group: profile.group });
              });
            });
            this.fileAccessRules = profiles.filter(profile => {
              if (groupName === '') return true;
              return groupName === profile.group;
            });
          } else {
            this.fileAccessRules = response['profile']['filters'];
          }

          this.filteredCount = this.fileAccessRules.length;

          this.gridHeight =
            this.source === GlobalConstant.NAV_SOURCE.GROUP
              ? this.w.innerHeight - 572
              : this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
                ? this.w.innerHeight - 300
                : 0;
          setTimeout(() => {
            this.getSelectedFileAccessRules.emit(this.selectedFileAccessRules);
            if (this.gridApi) {
              // this.gridApi.setRowData($scope.profile);
              this.gridApi.forEachNode((node, index) => {
                if (this.selectedFileAccessRules) {
                  if (
                    node.data.name === this.selectedFileAccessRules.name &&
                    node.data.path === this.selectedFileAccessRules.path
                  ) {
                    node.setSelected(true);
                    if (this.gridApi) this.gridApi.ensureNodeVisible(node);
                    this.getSelectedFileAccessRules.emit(
                      this.selectedFileAccessRules
                    );
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                  if (this.gridApi) this.gridApi.ensureNodeVisible(node);
                  this.getSelectedFileAccessRules.emit(
                    this.selectedFileAccessRules
                  );
                }
              });
              this.gridApi.sizeColumnsToFit();
            }
          });
        },
        err => {
          console.warn(err);
          if (err.status !== GlobalConstant.STATUS_NOT_FOUND) {
            this.gridOptions.overlayNoRowsTemplate =
              this.utils.getOverlayTemplateMsg(err);
          }
          this.fileAccessRules = [];
        }
      );
    }
  };

  showPredefinedRules = () => {
    this.isModalOpen = true;
    let predefinedRuleDialogRef = this.dialog.open(
      PredefinedFileAccessRulesModalComponent,
      {
        data: {
          groupName: this.groupName,
          source: this.source,
        },
        width: '70%',
      }
    );
    predefinedRuleDialogRef.afterClosed().subscribe(result => {
      this.isModalOpen = false;
    });
  };

  removeProfile = data => {
    let message = `${this.translate.instant('group.file.REMOVE_CONFIRM')} ${
      data.filter
    }`;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: message,
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.fileAccessRulesService.updateFileAccessRuleList(
            GlobalConstant.CRUD.D,
            this.selectedFileAccessRules,
            this.groupName
          );
        })
      )
      .subscribe(
        res => {
          // confirm actions
          this.notificationService.open(
            this.translate.instant('group.file.REMOVE_OK')
          );
          updateGridData(
            this.fileAccessRules,
            [data],
            this.gridApi!,
            'filter',
            'delete'
          );
          // close dialog
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
          this.selectedFileAccessRules = null;
          this.getSelectedFileAccessRules.emit(this.selectedFileAccessRules);
        },
        error => {
          this.notificationService.openError(
            error.error,
            this.translate.instant('group.file.REMOVE_NG')
          );
          dialogRef.componentInstance.loading = false;
        }
      );
  };

  editProfile = data => {
    this.isModalOpen = true;
    let editDialogRef = this.dialog.open(AddEditFileAccessRuleModalComponent, {
      data: {
        type: 'edit',
        groupName: this.groupName,
        selectedRule: data,
        source: this.source,
        getFileAccessRules: this.getFileAccessRules,
        gridApi: this.gridApi!,
        fileAccessRules: this.fileAccessRules,
      },
      width: '70%',
    });
    editDialogRef.afterClosed().subscribe(result => {
      this.isModalOpen = false;
      this.getSelectedFileAccessRules.emit(this.selectedFileAccessRules);
    });
  };

  addProfile = () => {
    this.isModalOpen = true;
    let addDialogRef = this.dialog.open(AddEditFileAccessRuleModalComponent, {
      data: {
        type: 'add',
        groupName: this.groupName,
        source: this.source,
        getFileAccessRules: this.getFileAccessRules,
        gridApi: this.gridApi!,
        fileAccessRules: this.fileAccessRules,
      },
      width: '70%',
    });
    addDialogRef.afterClosed().subscribe(result => {
      this.isModalOpen = false;
      this.getSelectedFileAccessRules.emit(this.selectedFileAccessRules);
    });
  };

  onGroupChanged = (groupName: string, gridOptions: GridOptions) => {
    if (gridOptions && this.gridApi) {
      const filterInstance = this.gridApi.getFilterInstance('group');
      if (filterInstance) {
        const model = filterInstance.getModel();
        filterInstance.setModel({
          type: 'equals',
          filter: groupName === 'All' ? '' : groupName,
        });
        this.gridApi.onFilterChanged();
        this.filteredCount =
          this.gridApi.getModel()['rootNode'].childrenAfterFilter.length;
      }
    }
  };

  private onSelectionChanged4File = () => {
    if (this.gridOptions && this.gridApi) {
      let selectedRows = this.gridApi.getSelectedRows();
      if (selectedRows.length > 0) {
        setTimeout(() => {
          this.selectedFileAccessRules = selectedRows[0];
          this.getSelectedFileAccessRules.emit(this.selectedFileAccessRules);
        });
      }
    }
  };

  private emitObjects = () => {
    this.getRemoveProfile.emit(this.removeProfile);
    this.getEditProfile.emit(this.editProfile);
    this.getAddProfile.emit(this.addProfile);
    this.getShowPredefinedRules.emit(this.showPredefinedRules);
  };
}
