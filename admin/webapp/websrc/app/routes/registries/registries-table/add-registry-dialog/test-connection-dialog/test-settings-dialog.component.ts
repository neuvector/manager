import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorResponse, RegistryConfig } from '@common/types';
import { AddRegistryDialogComponent } from '../add-registry-dialog.component';
import { UntypedFormGroup } from '@angular/forms';
import { cloneDeep } from 'lodash';
import { TestRegistryFieldConfig } from '../add-registry-form-configs';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { RegistriesService } from '@services/registries.service';
import { mergeMap, repeatWhen, takeUntil, tap } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { saveAs } from 'file-saver';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { TestConnectionDialogDetailsCellComponent } from './test-connection-dialog-details-cell/test-connection-dialog-details-cell.component';
import { TestConnectionDialogTypeCellComponent } from './test-connection-dialog-type-cell/test-connection-dialog-type-cell.component';

@Component({
  selector: 'app-test-settings-dialog',
  templateUrl: './test-settings-dialog.component.html',
  styleUrls: ['./test-settings-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestSettingsDialogComponent implements OnInit, OnDestroy {
  form = new UntypedFormGroup({});
  destroy$ = new Subject();
  model: any = {};
  fields = cloneDeep(TestRegistryFieldConfig);
  transactionID!: string;
  refreshSubject$ = new Subject();
  testingSwitch = false;
  subscription!: Subscription;
  savedFilters = [];
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  timeoutId;
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
    private snackBar: MatSnackBar,
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

  saveFilters(): void {
    this.savedFilters = this.form.controls.filters.value;
    this.snackBar.open(
      this.translate.instant('registry.COPIED'),
      this.translate.instant('general.CLOSE'),
      {
        duration: 3000,
      }
    );
  }

  testConnection(): void {
    this.gridApi.setRowData([]);
    this.testingSwitch = true;
    this.registriesService
      .testSettings({
        config: {
          name: this.data.name,
          registry_type: this.data.registry_type,
          filters: this.form.controls.filters.value,
          username: this.data.username,
          auth_token: this.data.auth_token,
          auth_with_token: this.data.auth_with_token,
          registry: this.data.registry,
        },
      })
      .pipe(
        takeUntil(this.destroy$),
        tap((r: any) => {
          this.transactionID = r.headers.get('X-Transaction-Id');
        }),
        mergeMap(() =>
          this.registriesService
            .testSettings(
              {
                config: {
                  name: this.data.name,
                  registry_type: this.data.registry_type,
                  filters: this.form.controls.filters.value,
                  username: this.data.username,
                  auth_token: this.data.auth_token,
                  auth_with_token: this.data.auth_with_token,
                  registry: this.data.registry,
                },
              },
              this.transactionID
            )
            .pipe(
              takeUntil(this.destroy$),
              tap((r: any) => {
                this.test(r.status === 206);
              }),
              repeatWhen(() => this.refreshSubject$)
            )
        )
      )
      .subscribe({
        next: (r: any) => this.gridApi.setRowData(r.body.steps),
        error: ({ error }: { error: ErrorResponse }) => {
          this.stopTest(error.message);
        },
      });
  }

  test(isScanning: boolean): void {
    if (isScanning) {
      this.testingSwitch = true;
      this.timeoutId = setTimeout(() => {
        this.refreshSubject$.next(true);
      }, 500);
    } else {
      this.testingSwitch = false;
    }
  }

  stopTest(error?: string): void {
    clearTimeout(this.timeoutId);
    this.destroy$.next(true);
    this.registriesService
      .deleteTestSettings(this.data.name, this.transactionID)
      .subscribe(() => {});
    const row = {
      step_type: 'stopped',
      step_content: error ? error : 'Test was stopped.',
    };
    const rows = this.getAllRows();
    rows.push(row);
    this.gridApi.setRowData(rows);
    this.testingSwitch = false;
    this.cd.markForCheck();
  }

  onNoClick(): void {
    this.dialogRef.close(this.savedFilters);
  }

  downloadTxt(): void {
    const blob = new Blob([JSON.stringify(this.getAllRows(), null, '\t')], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, 'Registry connection test report.txt');
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private getAllRows(): any[] {
    const rowData: any[] = [];
    this.gridApi.forEachNode((node: any) => rowData.push(node.data));
    return rowData;
  }
}
