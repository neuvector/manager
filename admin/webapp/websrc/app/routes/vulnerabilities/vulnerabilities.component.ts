import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { VulnerabilitiesCsvService } from './csv-generation/vulnerabilities-csv.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { MapConstant } from '@common/constants/map.constant';
import { MatDialog } from '@angular/material/dialog';
import { PdfGenerationDialogComponent } from './pdf-generation-dialog/pdf-generation-dialog.component';
import { VulnerabilityAsset, VulnerabilityView } from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-vulnerabilities',
  templateUrl: './vulnerabilities.component.html',
  styleUrls: ['./vulnerabilities.component.scss'],
})
export class VulnerabilitiesComponent implements OnDestroy {
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

  downloadCsv() {
    this.vulnerabilitiesCsvService.downloadCsv();
  }

  downloadAssetsCsv() {
    this.getAssetsViewReportData(this.vulnerabilitiesService.activeToken, 0, this.exportAssetsViewCsvFile);
  }

  printVulnerabilityPDF() {
    this.advFilter = this.vulnerabilitiesFilterService.advFilter;
    this.statisticCharts = {
      node: (
        document.getElementById('vulnNodesBarPDF') as HTMLCanvasElement
      ).toDataURL(),
      image: (
        document.getElementById('vulnImagesBarPDF') as HTMLCanvasElement
      ).toDataURL(),
    };
    if (this.advFilter.modified_dt) {
      this.vulnerabilitiesList = this.getFilteredVulnerabilities();
      this.isPrinting = true;
      setInterval(() => {
        if (this.printableReportView) {
          window.print();
          this.isPrinting = false;
        }
      }, 500);
    } else {
      const dialogRef = this.dialog.open(PdfGenerationDialogComponent, {
        width: '550px',
        data: {
          pdf_name: this.tr.instant('scan.report.PDF_LINK'),
        },
      });
      dialogRef.componentInstance.submitDate.subscribe(date => {
        if (date) {
          this.vulnerabilitiesList = this.getFilteredVulnerabilities(
            date.getTime() / 1000
          );
        } else {
          this.vulnerabilitiesList = this.getFilteredVulnerabilities();
        }
        dialogRef.componentInstance.saving$.next(false);
        dialogRef.componentInstance.onNoClick();
        this.isPrinting = true;
        setInterval(() => {
          if (this.printableReportView) {
            window.print();
            this.isPrinting = false;
          }
        }, 500);
      });
    }
  }

  printAssetsPDF2 = () => {
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
