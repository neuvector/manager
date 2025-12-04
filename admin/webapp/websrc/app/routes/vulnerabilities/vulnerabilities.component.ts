import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { VulnerabilitiesCsvService } from './csv-generation/vulnerabilities-csv.service';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { MatDialog } from '@angular/material/dialog';
import { PdfGenerationDialogComponent } from './pdf-generation-dialog/pdf-generation-dialog.component';
import { VulnerabilityView } from '@common/types';
import { VulnerabilityDetailDialogComponent } from '@components/vulnerabilities-grid/vulnerability-detail-dialog/vulnerability-detail-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { Vulnerability } from '@common/types';
import { tap } from 'rxjs/operators';


@Component({
  standalone: false,
  selector: 'app-vulnerabilities',
  templateUrl: './vulnerabilities.component.html',
  styleUrls: ['./vulnerabilities.component.scss'],
  
})
export class VulnerabilitiesComponent implements OnDestroy {
  @ViewChild(VulnerabilityDetailDialogComponent)
  vulDetails!: VulnerabilityDetailDialogComponent;
  @ViewChild('vulnerabilityViewReport') printableReportView!: ElementRef;
  @ViewChild('assetsViewReport') printableReportViewAssets!: ElementRef;

  vulnerabilitiesData$ = this.vulnerabilitiesService.vulnerabilitiesData$.pipe(
    tap(_ => this.refreshing$.next(false))
  );
  refreshing$ = this.vulnerabilitiesService.refreshing$;
  vulnerabilitiesList: any[] = [];
  masterData: any;
  masterGrids: any[][] = [];
  isFiltered: boolean = false;
  advFilter: any;
  isMeetingReportLimit: boolean = false;
  isPrinting: boolean = false;
  isPrintingAssets: boolean = false;
  withoutAppendix: boolean = false;
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

  constructor(
    private vulnerabilitiesService: VulnerabilitiesService,
    private vulnerabilitiesCsvService: VulnerabilitiesCsvService,
    public vulnerabilitiesFilterService: VulnerabilitiesFilterService,
    private dialog: MatDialog,
    private tr: TranslateService
  ) {}

  changeSelectedView(view: VulnerabilityView) {
    this.selectedView = view;
    this.vulnerabilitiesFilterService.vulQuerySubject$.next({
      ...this.vulnerabilitiesFilterService.vulQuerySubject$.value,
      viewType: this.selectedView,
    });
    setTimeout(() => {
      this.refresh();
    }, 300);
  }

  refresh() {
    this.refreshing$.next(true);
    this.vulnerabilitiesService.refresh();
  }

  vulnerabilitySelected(vulnerability: Vulnerability): void {
    this.selectedVulnerability = vulnerability;
    this.vulDetails.show();
  }

  downloadCsv() {
    const dialogRef = this.dialog.open(PdfGenerationDialogComponent, {
      width: '550px',
      data: {
        pdf_name: this.tr.instant('scan.report.PDF_LINK'),
        isPdf: false,
      },
    });
    dialogRef.componentInstance.submitDate.subscribe(params => {
      if (params.date) {
        this.getVulnerabilitiesViewReportData(
          this.vulnerabilitiesService.activeToken,
          this.exportVulnerabilitiesViewCsvFile,
          dialogRef,
          {
            lastModifiedTime: params.date.getTime() / 1000,
            withoutAppendix: params.withoutAppendix,
          }
        );
      } else {
        this.getVulnerabilitiesViewReportData(
          this.vulnerabilitiesService.activeToken,
          this.exportVulnerabilitiesViewCsvFile,
          dialogRef,
          {
            lastModifiedTime: 0,
            withoutAppendix: params.withoutAppendix,
          }
        );
      }
    });
  }

  downloadAssetsCsv() {
    const dialogRef = this.dialog.open(PdfGenerationDialogComponent, {
      width: '550px',
      data: {
        pdf_name: this.tr.instant('scan.report.PDF_LINK2'),
        isPdf: false,
      },
    });
    dialogRef.componentInstance.submitDate.subscribe(params => {
      if (params.date) {
        this.getAssetsViewReportData(
          this.vulnerabilitiesService.activeToken,
          this.exportAssetsViewCsvFile,
          dialogRef,
          {
            lastModifiedTime: params.date.getTime() / 1000,
            withoutAppendix: params.withoutAppendix,
          }
        );
      } else {
        this.getAssetsViewReportData(
          this.vulnerabilitiesService.activeToken,
          this.exportAssetsViewCsvFile,
          dialogRef,
          {
            lastModifiedTime: 0,
            withoutAppendix: params.withoutAppendix,
          }
        );
      }
    });
  }

  printVulnerabilityPDF = () => {
    const dialogRef = this.dialog.open(PdfGenerationDialogComponent, {
      width: '550px',
      data: {
        pdf_name: this.tr.instant('scan.report.PDF_LINK'),
        isPdf: true,
      },
    });
    dialogRef.componentInstance.submitDate.subscribe(params => {
      if (params.date) {
        this.getVulnerabilitiesViewReportData(
          this.vulnerabilitiesService.activeToken,
          this.exportVulnerabilitiesViewPdfFile,
          dialogRef,
          {
            lastModifiedTime: params.date.getTime() / 1000,
            withoutAppendix: params.withoutAppendix,
          }
        );
      } else {
        this.getVulnerabilitiesViewReportData(
          this.vulnerabilitiesService.activeToken,
          this.exportVulnerabilitiesViewPdfFile,
          dialogRef,
          {
            lastModifiedTime: 0,
            withoutAppendix: params.withoutAppendix,
          }
        );
      }
    });
  };

  printAssetsPDF = () => {
    const dialogRef = this.dialog.open(PdfGenerationDialogComponent, {
      width: '550px',
      data: {
        pdf_name: this.tr.instant('scan.report.PDF_LINK2'),
        isPdf: true,
      },
    });
    dialogRef.componentInstance.submitDate.subscribe(params => {
      if (params.date) {
        this.getAssetsViewReportData(
          this.vulnerabilitiesService.activeToken,
          this.exportAssetsViewPdfFile,
          dialogRef,
          {
            lastModifiedTime: params.date.getTime() / 1000,
            withoutAppendix: params.withoutAppendix,
          }
        );
      } else {
        this.getAssetsViewReportData(
          this.vulnerabilitiesService.activeToken,
          this.exportAssetsViewPdfFile,
          dialogRef,
          {
            lastModifiedTime: 0,
            withoutAppendix: params.withoutAppendix,
          }
        );
      }
    });
  };

  private getVulnerabilitiesViewReportData = (
    queryToken: string,
    cb: Function,
    dialogRef,
    options
  ) => {
    this.withoutAppendix = options.withoutAppendix;
    this.vulnerabilitiesService
      .getVulnerabilitiesViewReportData(options.lastModifiedTime)
      .subscribe(
        (response: any) => {
          cb(
            this.vulnerabilitiesService.extractPodImage(response.data),
            dialogRef
          );
        },
        error => {}
      );
  };

  private getAssetsViewReportData = (
    queryToken: string,
    cb: Function,
    dialogRef,
    options
  ) => {
    this.withoutAppendix = options.withoutAppendix;
    this.vulnerabilitiesService
      .getAssetsViewReportData(queryToken, options.lastModifiedTime)
      .subscribe(
        (response: any) => {
          cb(response, dialogRef);
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

  private exportAssetsViewPdfFile = (data: any, dialogRef) => {
    console.log('Assets View data()PDF: ', data);
    this.masterGrids = [
      data.workloads,
      data.nodes,
      data.platforms,
      data.images,
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

  private exportVulnerabilitiesViewCsvFile = (data: any, dialogRef) => {
    console.log('Vulnerabilities View data(CSV): ', data);
    dialogRef.componentInstance.saving$.next(false);
    dialogRef.componentInstance.onNoClick();
    this.vulnerabilitiesCsvService.downloadCsv(data);
  };

  private exportAssetsViewCsvFile = (data: any, dialogRef) => {
    console.log('Assets View data(CSV): ', data);
    dialogRef.componentInstance.saving$.next(false);
    dialogRef.componentInstance.onNoClick();
    this.vulnerabilitiesCsvService.downloadAssetsViewCsv(data);
  };

  ngOnDestroy() {
    this.vulnerabilitiesFilterService.vulQuerySubject$.next({
      ...this.vulnerabilitiesFilterService.initVulQuery(),
      viewType: this.displayViews[0],
    });
  }
}
