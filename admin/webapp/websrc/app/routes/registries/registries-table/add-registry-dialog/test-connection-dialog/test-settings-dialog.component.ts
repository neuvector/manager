import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorResponse, RegistryConfig, RegistryConfigV2 } from '@common/types';
import { AddRegistryDialogComponent } from '../add-registry-dialog.component';
import { FormGroup } from '@angular/forms';
import { cloneDeep } from 'lodash';
import { TestRegistryFieldConfig } from '../add-registry-form-configs';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { RegistriesService } from '@services/registries.service';
import {
  delay,
  expand,
  finalize,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { EMPTY, Subject, Subscription } from 'rxjs';
import { saveAs } from 'file-saver';
import { TranslateService } from '@ngx-translate/core';
import { TestConnectionDialogDetailsCellComponent } from './test-connection-dialog-details-cell/test-connection-dialog-details-cell.component';
import { TestConnectionDialogTypeCellComponent } from './test-connection-dialog-type-cell/test-connection-dialog-type-cell.component';
import { FormlyFormOptions } from '@ngx-formly/core';

@Component({
  standalone: false,
  selector: 'app-test-settings-dialog',
  templateUrl: './test-settings-dialog.component.html',
  styleUrls: ['./test-settings-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestSettingsDialogComponent implements OnInit, OnDestroy {
  form = new FormGroup<any>({});
  destroy$ = new Subject();
  model: any = {};
  gridData: { step_type: string; step_content: string }[] = [];
  fields = cloneDeep(TestRegistryFieldConfig);
  options: FormlyFormOptions = {
    formState: {
      filtersChanged: false,
    },
  };
  transactionID!: string;
  refreshSubject$ = new Subject();
  testingSwitch = false;
  subscription!: Subscription;
  savedFilters = [];
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'step_type',
      cellRenderer: 'typeCellRenderer',
      headerValueGetter: () => this.translate.instant('multiCluster.grid.type'),
      initialWidth: 40,
    },
    {
      field: 'step_content',
      cellRenderer: 'detailsCellRenderer',
      wrapText: true,
      autoHeight: true,
      headerValueGetter: () => this.translate.instant('registry.DETAILS'),
    },
  ];

  constructor(
    public dialogRef: MatDialogRef<AddRegistryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegistryConfig,
    private registriesService: RegistriesService,
    private translate: TranslateService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.model = cloneDeep(this.data);
    this.gridOptions = {
      rowData: [],
      columnDefs: this.columnDefs,
      onGridReady: event => this.onGridReady(event),
      components: {
        detailsCellRenderer: TestConnectionDialogDetailsCellComponent,
        typeCellRenderer: TestConnectionDialogTypeCellComponent,
      },
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  testConnection(): void {
    const config: RegistryConfigV2 = {
      name: this.data.name,
      registry_type: this.data.registry_type,
      registry: this.data.registry,
      filters: this.form.controls.filters.value,
      auth: {
        username: this.data.username,
        password: this.data.password,
        auth_token: this.data.auth_token,
        auth_with_token: this.data.auth_with_token,
      },
      scan: {
        rescan_after_db_update: this.data.rescan_after_db_update,
        scan_layers: this.data.scan_layers,
        schedule: this.data.schedule,
        ignore_proxy: !this.data.use_proxy,
      },
      integrations: {
        jfrog_mode: this.data.jfrog_mode,
      },
    };
    this.gridData = [];
    this.gridApi.setGridOption('rowData', this.gridData);
    this.testingSwitch = true;
    this.registriesService
      .testSettings({
        config,
      })
      .pipe(
        takeUntil(this.destroy$),
        tap((r: any) => {
          this.transactionID = r.headers.get('X-Transaction-Id');
        }),
        switchMap(() =>
          this.registriesService
            .testSettings(
              {
                config,
              },
              this.transactionID
            )
            .pipe(
              expand((r: any) =>
                r.status === 206
                  ? this.registriesService
                      .testSettings(
                        {
                          config,
                        },
                        this.transactionID
                      )
                      .pipe(delay(1000))
                  : EMPTY.pipe(finalize(() => (this.testingSwitch = false)))
              ),
              takeUntil(this.destroy$)
            )
        )
      )
      .subscribe({
        next: (r: any) => {
          this.gridData = r.body.steps;
          this.gridApi.setGridOption('rowData', this.gridData);
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.stopTest(error.message);
        },
      });
  }

  stopTest(error?: string): void {
    this.destroy$.next(true);
    this.registriesService
      .deleteTestSettings(this.data.name, this.transactionID)
      .subscribe(() => {});
    const row = {
      step_type: 'stopped',
      step_content: error ? error : 'Test was stopped.',
    };
    this.gridData = [...this.gridData, row];
    this.gridApi.setGridOption('rowData', this.gridData);
    this.testingSwitch = false;
    this.cd.markForCheck();
  }

  onNoClick(saveFilters: boolean = false): void {
    this.dialogRef.close(saveFilters ? this.form.controls.filters.value : []);
  }

  downloadTxt(): void {
    const blob = new Blob([JSON.stringify(this.gridData, null, '\t')], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, 'Registry connection test report.txt');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
