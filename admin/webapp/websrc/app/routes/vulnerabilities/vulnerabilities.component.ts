import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { VulnerabilitiesCsvService } from './csv-generation/vulnerabilities-csv.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { MapConstant } from '@common/constants/map.constant';
import { MatDialog } from '@angular/material/dialog';
import { PdfGenerationDialogComponent } from './pdf-generation-dialog/pdf-generation-dialog.component';
import { VulnerabilityAsset, VulnerabilityView } from '@common/types';
import { VulnerabilityDetailDialogComponent } from '@components/vulnerabilities-grid/vulnerability-detail-dialog/vulnerability-detail-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import {
  Vulnerability
} from '@common/types';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-vulnerabilities',
  templateUrl: './vulnerabilities.component.html',
  styleUrls: ['./vulnerabilities.component.scss'],
})
export class VulnerabilitiesComponent implements OnInit, OnDestroy {
  vulnerabilitiesData$ = this.vulnerabilitiesService.vulnerabilitiesData$.pipe(
    tap(_ => this.refreshing$.next(false))
  );
  refreshing$ = this.vulnerabilitiesService.refreshing$;
  private _switchClusterSubscription;
  vulnerabilitiesList: any[] = [];
  masterData: any;
  masterGrids: any[][] = [];
  isFiltered: boolean = false;
  advFilter: any;
  isMeetingReportLimit: boolean = false;
  isPrinting: boolean = false;
  isPrintingAssets: boolean = false;
  statisticCharts: any = {
    node: null,
    image: null,
  };
  styleMap4Severity: any = {
    high: 'danger',
    medium: 'warning',
    low: 'success',
  };
  displayViews: VulnerabilityView[] = [
    'all',
    'containers',
    'infrastructure',
    'registry',
  ];
  selectedView = this.displayViews[0];
  selectedVulnerability!: Vulnerability;
  @ViewChild(VulnerabilityDetailDialogComponent) vulDetails!: VulnerabilityDetailDialogComponent;
  @ViewChild('vulnerabilityViewReport') printableReportView!: ElementRef;
  @ViewChild('assetsViewReport') printableReportViewAssets!: ElementRef;

  constructor(
    private vulnerabilitiesService: VulnerabilitiesService,
    private vulnerabilitiesCsvService: VulnerabilitiesCsvService,
    private multiClusterService: MultiClusterService,
    public vulnerabilitiesFilterService: VulnerabilitiesFilterService,
    private dialog: MatDialog,
    private tr: TranslateService
  ) {
    //refresh the page when it switched to a remote cluster
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        this.refresh();
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  changeSelectedView(view: VulnerabilityView) {
    this.selectedView = view;
    this.vulnerabilitiesFilterService.vulQuerySubject$.next({
      ...this.vulnerabilitiesFilterService.vulQuerySubject$.value,
      viewType: this.selectedView,
    });
    this.refresh();
  }

  refresh() {
    this.refreshing$.next(true);
    this.vulnerabilitiesService.refresh();
  }

  vulnerabilitySelected(vulnerability: Vulnerability): void {
    console.log("vulnerability", vulnerability);
    this.selectedVulnerability = vulnerability;
    this.vulDetails.show();
  }

  downloadCsv() {
    this.getVulnerabilitiesViewReportData(this.vulnerabilitiesService.activeToken, 0, this.exportVulnerabilitiesViewCsvFile);
  }

  downloadAssetsCsv() {
    this.getAssetsViewReportData(this.vulnerabilitiesService.activeToken, 0, this.exportAssetsViewCsvFile);
  }

  printVulnerabilityPDF = () => {
    const dialogRef = this.dialog.open(PdfGenerationDialogComponent, {
      width: '550px',
      data: {
        pdf_name: this.tr.instant('scan.report.PDF_LINK'),
      },
    });
    dialogRef.componentInstance.submitDate.subscribe(date => {
      if (date) {
        this.getVulnerabilitiesViewReportData(this.vulnerabilitiesService.activeToken, date.getTime() / 1000, this.exportVulnerabilitiesViewPdfFile, dialogRef);
      } else {
        this.getVulnerabilitiesViewReportData(this.vulnerabilitiesService.activeToken, 0, this.exportVulnerabilitiesViewPdfFile, dialogRef);
      }
    });
  };

  printAssetsPDF = () => {
    const dialogRef = this.dialog.open(PdfGenerationDialogComponent, {
      width: '550px',
      data: {
        pdf_name: this.tr.instant('scan.report.PDF_LINK2'),
      },
    });
    dialogRef.componentInstance.submitDate.subscribe(date => {
      if (date) {
        this.getAssetsViewReportData(this.vulnerabilitiesService.activeToken, date.getTime() / 1000, this.exportAssetsViewPdfFile, dialogRef);
      } else {
        this.getAssetsViewReportData(this.vulnerabilitiesService.activeToken, 0, this.exportAssetsViewPdfFile, dialogRef);
      }
    });
  };

  private getVulnerabilitiesViewReportData = (queryToken: string, lastModifiedTime: number, cb: Function, dialogRef?) => {
    this.vulnerabilitiesService.getVulnerabilitiesViewReportData(queryToken, lastModifiedTime)
      .subscribe(
        (response: any) => {
          cb(response.data, dialogRef);
        },
        error => {}
      );
  };

  private exportVulnerabilitiesViewPdfFile = (data: any, dialogRef) => {
    console.log('Vulnerabilities View data()PDF: ', data);
    this.vulnerabilitiesList = data;
    dialogRef.componentInstance.saving$.next(false);
    dialogRef.componentInstance.onNoClick();
    this.statisticCharts = {
      node: (
        document.getElementById('vulnNodesBarPDF') as HTMLCanvasElement
      ).toDataURL(),
      image: (
        document.getElementById('vulnImagesBarPDF') as HTMLCanvasElement
      ).toDataURL(),
    };
    this.isPrinting = true;
    setInterval(() => {
      if (this.printableReportView) {
        window.print();
        this.isPrinting = false;
      }
    }, 500);
  };

  private getAssetsViewReportData = (queryToken: string, lastModifiedTime: number, cb: Function, dialogRef?) => {
    this.vulnerabilitiesService.getAssetsViewReportData(queryToken, lastModifiedTime)
      .subscribe(
        (response: any) => {
          cb(response, dialogRef);
        },
        error => {}
      );
  };

  private exportAssetsViewPdfFile = (data: any, dialogRef) => {
    console.log('Assets View data()PDF: ', data);
    this.masterGrids = [
      data.workloads,
      data.nodes,
      data.platforms,
      data.images
    ];
    this.vulnerabilitiesList = data.vulnerabilities;
    dialogRef.componentInstance.saving$.next(false);
    dialogRef.componentInstance.onNoClick();
    this.isPrintingAssets = true;
    setInterval(() => {
      if (this.printableReportViewAssets) {
        window.print();
        this.isPrintingAssets = false;
      }
    }, 500);
  };

  private exportVulnerabilitiesViewCsvFile = (data: any) => {
    console.log('Vulnerabilities View data(CSV): ', data);
    this.vulnerabilitiesCsvService.downloadCsv(data);
  };

  private exportAssetsViewCsvFile = (data: any) => {
    console.log('Assets View data(CSV): ', data);
    this.vulnerabilitiesCsvService.downloadAssetsViewCsv(data);
  };

  private getFilteredVulnerabilities = (lastTimestamp?: number) => {
    let vulnerabilitiesList: any[] = [];
    this.vulnerabilitiesService.gridApi.forEachNodeAfterFilter(rowNode => {
      let vul: VulnerabilityAsset = rowNode.data;
      if (!lastTimestamp || vul.last_modified_timestamp > lastTimestamp) {
        vulnerabilitiesList.push(vul);
      }
    });
    this.isMeetingReportLimit =
      vulnerabilitiesList.length > MapConstant.SEC_RISK_REPORT_MAX_ROW;
    return this.isMeetingReportLimit
      ? vulnerabilitiesList
          .sort((a, b) => b.published_timestamp - a.published_timestamp)
          .slice(0, MapConstant.SEC_RISK_REPORT_MAX_ROW)
      : vulnerabilitiesList;
  };
}
