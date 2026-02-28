import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AdvancedFilter } from './partial/advanced-filter/advanced-filter';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs/internal/operators/map';
import { catchError } from 'rxjs/internal/operators/catchError';
import { AssetsHttpService } from '@common/api/assets-http.service';
import { ContainersService } from '@services/containers.service';
import { NodesService } from '@services/nodes.service';
import { filter, of } from 'rxjs';
import { saveAs } from 'file-saver';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  standalone: false,
  selector: 'app-assets-scan-report-button',
  templateUrl: './assets-scan-report-button.html',
  styleUrl: './assets-scan-report-button.scss',
})
export class AssetsScanReportButton implements OnInit, OnDestroy {
  @Input() assetType!: 'node' | 'container';
  filterOpen = false;
  filterDialog!: MatDialogRef<any>;
  domains!: string[];
  isReportGenerating = false;
  fullReport = [];

  constructor(
    private dialog: MatDialog,
    private tr: TranslateService,
    private assetsHttpService: AssetsHttpService,
    private containersService: ContainersService,
    private nodesService: NodesService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.getDomain().subscribe(domains => {
      this.domains = domains;
    });
  }
  getDomain(): Observable<string[]> {
    return this.assetsHttpService.getDomain().pipe(
      map(data => {
        return data.domains
          .map(domain => domain.name)
          .filter(domain => domain.charAt(0) !== '_');
      }),
      catchError(err => {
        if (
          [MapConstant.NOT_FOUND, MapConstant.ACC_FORBIDDEN].includes(
            err.status
          )
        ) {
          return of([]);
        } else {
          throw err;
        }
      })
    );
  }
  exportFullAssetsScanReport = (): void => {
    if (!this.filterOpen) {
      this.filterOpen = true;
      this.filterDialog = this.dialog.open(AdvancedFilter, {
        width: '675px',
        data: {
          filter: MapConstant.INIT_VUL_ADV_FILTER,
          domains: this.domains,
          assetType: this.assetType,
        },
        hasBackdrop: false,
        position: { right: '25px', top: '100px' },
      });
      this.filterDialog.afterClosed().subscribe(filter => {
        if (!filter) {
          this.filterOpen = false;
          return;
        }
        this.sendAssetsVulnRequest(filter);
      });
    }
  };

  sendAssetsVulnRequest(filter) {
    const payload = this.parseFilterToPayload(filter, this.assetType);
    this.isReportGenerating = true;
    console.profile('Generating CSV file');
    (this.assetType === 'container'
      ? this.containersService.getWorkloadsVulnerabilities(payload)
      : this.nodesService.getNodesVulnerabilities(payload)
    ).subscribe({
      next: value => {
        const filename = `${this.assetType}_scan_report_${this.utils.parseDatetimeStr(
          new Date()
        )}.csv`;
        try {
          console.log(
            'Received vulnerabilities batch: ',
            value.cursor,
            value.scan_data.length,
            ' records'
          );
          if (
            value.cursor &&
            value.scan_data &&
            value.scan_data.length ===
              GlobalConstant.ASSETS_REPORT.MAX_LENGTH_PER_PAGE &&
            this.fullReport.length + value.scan_data.length <
              GlobalConstant.ASSETS_REPORT.MAX_LENGTH_TOTAL
          ) {
            console.log(
              'Fetching next page of vulnerabilities with cursor: ',
              value.cursor
            );
            this.fullReport = this.fullReport.concat(value.scan_data);
            this.sendAssetsVulnRequest({
              ...filter,
              cursor: value.cursor,
            });
          } else {
            this.fullReport = this.fullReport.concat(value.scan_data);
            console.log(
              'Received vulnerabilities batch: ',
              value.cursor,
              value.scan_data.length,
              ' records'
            );
            console.log(
              'All vulnerabilities fetched. Total records: ',
              this.fullReport.length
            );
            this.processDownloadCSV(this.fullReport, this.assetType, filename);
            this.filterOpen = false;
          }
        } catch (err) {
          console.error('Error processing vulnerabilities: ', err);
          this.isReportGenerating = false;
          this.fullReport.length = 0; // Clear the full report data to free memory
          return;
        }
      },
      error: err => {
        console.error('Error fetching vulnerabilities: ', err);
        this.isReportGenerating = false;
        this.fullReport.length = 0; // Clear the full report data to free memory
      },
    });
  }

  processDownloadCSV(data: any[], assetType: string, filename: string): void {
    if (assetType === 'node') {
      const csvData = this.nodesService.formatVulnerabilitiesToCSV(data);
      this.downloadCSVFile(csvData, filename);
    } else if (assetType === 'container') {
      const csvData = this.containersService.formatVulnerabilitiesToCSV(data);
      this.downloadCSVFile(csvData, filename);
    }
  }

  downloadCSVFile(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
    this.isReportGenerating = false;
    this.fullReport.length = 0; // Clear the full report data to free memory
    console.profileEnd('CSV file generated and download initiated');
  }

  parseFilterToPayload(filter: any, assetType: string): any {
    console.log('filter', filter);
    const payload: any = {
      ...filter,
      max_cve_records: GlobalConstant.ASSETS_REPORT.MAX_LENGTH_PER_PAGE,
      vul_score_filter: {
        score_version: filter?.scoreType === 'v2' ? 'v2' : 'v3',
        score_bottom:
          (filter?.scoreType === 'v2'
            ? filter?.scoreV2?.[0]
            : filter?.scoreV3?.[0]) ?? 0,
        score_top:
          (filter?.scoreType === 'v2'
            ? filter?.scoreV2?.[1]
            : filter?.scoreV3?.[1]) ?? 10,
      },
      filters: [],
    };

    const pushFilter = (
      name: string,
      matchType: string | undefined,
      value: string | string[] | undefined
    ) => {
      const values = (Array.isArray(value) ? value : [value]).filter(
        (v): v is string => typeof v === 'string' && v.trim().length > 0
      );
      if (!values.length) return;

      payload.filters.push({
        name,
        op: this.mapMatchTypeToOp(matchType),
        value: values,
      });
    };

    if (assetType === 'container') {
      pushFilter('domain', filter?.matchTypeNs, filter?.selectedDomains);
      pushFilter(
        'image_name',
        filter?.matchTypeImage,
        filter?.imageName?.split(',').map((s: string) => s.trim())
      );
      pushFilter(
        'container_name',
        filter?.matchTypeContainer,
        filter?.containerName?.split(',').map((s: string) => s.trim())
      );
      pushFilter(
        'host_name',
        filter?.matchTypeNode,
        filter?.nodeName?.split(',').map((s: string) => s.trim())
      );
    }

    if (assetType === 'node') {
      pushFilter(
        'name',
        filter?.matchTypeNode,
        filter?.nodeName?.split(',').map((s: string) => s.trim())
      );
    }

    return payload;
  }

  private mapMatchTypeToOp(matchType?: string): string {
    switch ((matchType || '').toLowerCase()) {
      case 'contains':
        return 'in';
      case 'not_contains':
        return 'notin';
      case 'equals':
      case 'eq':
        return 'eq';
      case 'not_equals':
      case '!eq':
        return 'neq';
      default:
        return 'eq';
    }
  }

  ngOnDestroy(): void {
    if (this.filterDialog) {
      this.filterDialog.close();
    }
  }
}
