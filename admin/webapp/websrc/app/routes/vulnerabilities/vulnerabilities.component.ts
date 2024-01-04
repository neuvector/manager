import { Component, ViewChild, ElementRef } from '@angular/core';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { VulnerabilitiesCsvService } from './csv-generation/vulnerabilities-csv.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { MapConstant } from '@common/constants/map.constant';
import { MatDialog } from '@angular/material/dialog';
import { PdfGenerationDialogComponent } from './pdf-generation-dialog/pdf-generation-dialog.component';
import { VulnerabilityAsset, VulnerabilityView } from '@common/types';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-vulnerabilities',
  templateUrl: './vulnerabilities.component.html',
  styleUrls: ['./vulnerabilities.component.scss'],
})
export class VulnerabilitiesComponent {
  vulnerabilitiesData$ = this.vulnerabilitiesService.initVulnerability();
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
  queryToken: string = '3749a385b839';
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
  }

  refresh() {
    this.vulnerabilitiesService.refresh();
  }

  downloadCsv() {
    this.vulnerabilitiesCsvService.downloadCsv();
  }

  downloadAssetsCsv() {
    this.getAssetsViewReportData(this.queryToken, 0, this.exportAssetsViewCsvFile);
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

  // printAssetsPDF() {
  //   this.advFilter = this.vulnerabilitiesFilterService.advFilter;
  //   this.masterData = {
  //     workloadMap4Pdf: JSON.parse(
  //       JSON.stringify(this.vulnerabilitiesService.workloadMap4Pdf)
  //     ),
  //     hostMap4Pdf: JSON.parse(
  //       JSON.stringify(this.vulnerabilitiesService.hostMap4Pdf)
  //     ),
  //     platformMap4Pdf: JSON.parse(
  //       JSON.stringify(this.vulnerabilitiesService.platformMap4Pdf)
  //     ),
  //     imageMap4Pdf: JSON.parse(
  //       JSON.stringify(this.vulnerabilitiesService.imageMap4Pdf)
  //     ),
  //   };
  //   console.log('this.masterData', this.masterData);
  //   this.vulnerabilitiesList = this.getFilteredVulnerabilities();
  //   this.isFiltered = this.vulnerabilitiesFilterService.filtered;
  //   if (this.advFilter.modified_dt) {
  //     this.vulnerabilitiesList = this.getFilteredVulnerabilities();
  //     this.masterGrids = this.prepareDetails(
  //       this.masterData,
  //       this.vulnerabilitiesList,
  //       this.isFiltered,
  //       this.advFilter
  //     );
  //     this.isPrintingAssets = true;
  //     setInterval(() => {
  //       if (this.printableReportViewAssets) {
  //         window.print();
  //         this.isPrintingAssets = false;
  //       }
  //     }, 500);
  //   } else {
  //     const dialogRef = this.dialog.open(PdfGenerationDialogComponent, {
  //       width: '550px',
  //       data: {
  //         pdf_name: this.tr.instant('scan.report.PDF_LINK2'),
  //       },
  //     });
  //     dialogRef.componentInstance.submitDate.subscribe(date => {
  //       if (date) {
  //         this.vulnerabilitiesList = this.getFilteredVulnerabilities(
  //           date.getTime() / 1000
  //         );
  //       } else {
  //         this.vulnerabilitiesList = this.getFilteredVulnerabilities();
  //       }
  //       this.masterGrids = this.prepareDetails(
  //         this.masterData,
  //         this.vulnerabilitiesList,
  //         this.isFiltered,
  //         this.advFilter
  //       );
  //       dialogRef.componentInstance.saving$.next(false);
  //       dialogRef.componentInstance.onNoClick();
  //       this.isPrintingAssets = true;
  //       setInterval(() => {
  //         if (this.printableReportViewAssets) {
  //           window.print();
  //           this.isPrintingAssets = false;
  //         }
  //       }, 500);
  //     });
  //   }
  // }

  printAssetsPDF2 = () => {
    const dialogRef = this.dialog.open(PdfGenerationDialogComponent, {
      width: '550px',
      data: {
        pdf_name: this.tr.instant('scan.report.PDF_LINK2'),
      },
    });
    dialogRef.componentInstance.submitDate.subscribe(date => {
      if (date) {
        this.getAssetsViewReportData(this.queryToken, date.getTime() / 1000, this.exportAssetsViewPdfFile, dialogRef);
      } else {
        this.getAssetsViewReportData(this.queryToken, 0, this.exportAssetsViewPdfFile, dialogRef);
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

  // private prepareDetails = (masterData, vuls, isFiltered, advFilter) => {
  //   if (isFiltered) {
  //     return this.prepareData4Filtered(masterData, vuls, advFilter);
  //   } else {
  //     return this.mergeData4NonFiltered(masterData, vuls);
  //   }
  // };

  // private prepareData4Filtered = (masterData, vuls, advFilter) => {
  //   let grids = [[], [], [], []];
  //   let workloadMap4FilteredPdf = {};
  //   let hostMap4FilteredPdf = {};
  //   let imageMap4FilteredPdf = {};
  //   let vulWorkloadInit = {
  //     pod_name: '',
  //     domain: '',
  //     applications: [],
  //     policy_mode: '',
  //     service_group: '',
  //     scanned_at: '',
  //     high: 0,
  //     medium: 0,
  //     low: 0,
  //     evaluation: 0,
  //     vulnerabilites: [],
  //   };
  //   let vulHostInit = {
  //     name: '',
  //     os: '',
  //     kernel: '',
  //     cpus: 0,
  //     memory: 0,
  //     containers: 0,
  //     policy_mode: '',
  //     scanned_at: '',
  //     high: 0,
  //     medium: 0,
  //     low: 0,
  //     evaluation: 0,
  //     vulnerabilites: [],
  //   };
  //   let vulImageInit = {
  //     image_name: '',
  //     high: 0,
  //     medium: 0,
  //     low: 0,
  //     vulnerabilites: [],
  //   };
  //   vuls.forEach(vul => {
  //     vul.workloads.forEach(workload => {
  //       if (
  //         vul.workloads &&
  //         Array.isArray(vul.workloads) &&
  //         vul.workloads.length > 0 &&
  //         (advFilter.containerName ||
  //           advFilter.serviceName ||
  //           advFilter.selectedDomains.length > 0)
  //       ) {
  //         let patterns = advFilter.containerName
  //           .split(',')
  //           .map(item => item.trim())
  //           .filter(item => item.length > 0);
  //         let servicePatterns = advFilter.serviceName
  //           .split(',')
  //           .map(item => item.trim())
  //           .filter(item => item.length > 0);
  //         let domainPatterns = advFilter.selectedDomains
  //           .map(item => item.trim())
  //           .filter(item => item.length > 0);
  //         console.log('domainPatterns: ', servicePatterns);
  //
  //         if (masterData.workloadMap4Pdf[workload.id])
  //           console.log(
  //             'workloads: ',
  //             masterData.workloadMap4Pdf[workload.id].service_group,
  //             new RegExp(domainPatterns.join('|')).test(
  //               masterData.workloadMap4Pdf[workload.id].service_group
  //             )
  //           );
  //         if (
  //           ((patterns.length > 0 &&
  //             new RegExp(patterns.join('|')).test(workload.display_name)) ||
  //             patterns.length === 0) &&
  //           ((servicePatterns.length > 0 &&
  //             masterData.workloadMap4Pdf[workload.id] &&
  //             new RegExp(servicePatterns.join('|')).test(
  //               masterData.workloadMap4Pdf[workload.id].service_group.substring(
  //                 3
  //               )
  //             )) ||
  //             servicePatterns.length === 0) &&
  //           ((domainPatterns.length > 0 &&
  //             masterData.workloadMap4Pdf[workload.id] &&
  //             new RegExp(domainPatterns.join('|')).test(
  //               masterData.workloadMap4Pdf[workload.id].domain
  //             )) ||
  //             domainPatterns.length === 0)
  //         ) {
  //           console.log(
  //             'workloads_1: ',
  //             masterData.workloadMap4Pdf[workload.id].service_group,
  //             new RegExp(domainPatterns.join('|')).test(
  //               masterData.workloadMap4Pdf[workload.id].service_group
  //             )
  //           );
  //           let vulWorkload = masterData.workloadMap4Pdf[workload.id];
  //           if (vulWorkload) {
  //             vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //             vulWorkload.medium +=
  //               vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //             vulWorkload.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //             vulWorkload.evaluation =
  //               vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
  //             vulWorkload.vulnerabilites.push({
  //               text: vul.name,
  //               style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //             });
  //           } else {
  //             vulWorkload = JSON.parse(JSON.stringify(vulWorkloadInit));
  //             let workloadInfo = masterData.workloadMap4Pdf[workload.id];
  //             vulWorkload.pod_name = workload.display_name || '';
  //             vulWorkload.domain = workloadInfo.domain || '';
  //             vulWorkload.applications = workloadInfo.applications || '';
  //             vulWorkload.policy_mode = workload.policy_mode || '';
  //             vulWorkload.service_group = workloadInfo.service_group || '';
  //             vulWorkload.scanned_at = workloadInfo.scanned_at || '';
  //             vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //             vulWorkload.medium +=
  //               vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //             vulWorkload.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //             vulWorkload.evaluation =
  //               vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
  //             vulWorkload.vulnerabilites.push({
  //               text: vul.name || '',
  //               style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //             });
  //           }
  //           workloadMap4FilteredPdf[workload.id] = vulWorkload;
  //         }
  //       } else {
  //         let vulWorkload = JSON.parse(JSON.stringify(vulWorkloadInit));
  //         let workloadInfo = masterData.workloadMap4Pdf[workload.id];
  //         vulWorkload.pod_name = workload.display_name || '';
  //         vulWorkload.domain = workloadInfo.domain || '';
  //         vulWorkload.applications = workloadInfo.applications || '';
  //         vulWorkload.policy_mode = workload.policy_mode || '';
  //         vulWorkload.service_group = workloadInfo.service_group || '';
  //         vulWorkload.scanned_at = workloadInfo.scanned_at || '';
  //         vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //         vulWorkload.medium += vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //         vulWorkload.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //         vulWorkload.evaluation =
  //           vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
  //         vulWorkload.vulnerabilites.push({
  //           text: vul.name || '',
  //           style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //         });
  //         workloadMap4FilteredPdf[workload.id] = vulWorkload;
  //       }
  //     });
  //     vul.nodes.forEach(host => {
  //       if (
  //         vul.nodes &&
  //         Array.isArray(vul.nodes) &&
  //         vul.nodes.length > 0 &&
  //         advFilter.nodeName
  //       ) {
  //         let patterns = advFilter.nodeName.split(',').map(item => item.trim());
  //         if (new RegExp(patterns.join('|')).test(host.display_name)) {
  //           let vulHost = hostMap4FilteredPdf[host.id];
  //           if (vulHost) {
  //             vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //             vulHost.medium += vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //             vulHost.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //             vulHost.evaluation =
  //               vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
  //             vulHost.vulnerabilites.push({
  //               text: vul.name,
  //               style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //             });
  //           } else {
  //             vulHost = JSON.parse(JSON.stringify(vulHostInit));
  //             let hostInfo = masterData.hostMap4Pdf[host.id];
  //             vulHost.name = host.display_name || '';
  //             vulHost.os = hostInfo.os || '';
  //             vulHost.kernel = hostInfo.kernel || '';
  //             vulHost.cpus = hostInfo.cpus || '';
  //             vulHost.memory = hostInfo.memory || '';
  //             vulHost.containers = hostInfo.containers || '';
  //             vulHost.policy_mode = host.policy_mode || '';
  //             vulHost.scanned_at = hostInfo.scanned_at || '';
  //             vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //             vulHost.medium += vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //             vulHost.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //             vulHost.evaluation =
  //               vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
  //             vulHost.vulnerabilites.push({
  //               text: vul.name || '',
  //               style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //             });
  //           }
  //           hostMap4FilteredPdf[host.id] = vulHost;
  //         }
  //       } else {
  //         let vulHost = JSON.parse(JSON.stringify(vulHostInit));
  //         let hostInfo = masterData.hostMap4Pdf[host.id];
  //         vulHost.name = host.display_name || '';
  //         vulHost.os = hostInfo.os || '';
  //         vulHost.kernel = hostInfo.kernel || '';
  //         vulHost.cpus = hostInfo.cpus || '';
  //         vulHost.memory = hostInfo.memory || '';
  //         vulHost.containers = hostInfo.containers || '';
  //         vulHost.policy_mode = host.policy_mode || '';
  //         vulHost.scanned_at = hostInfo.scanned_at || '';
  //         vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //         vulHost.medium += vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //         vulHost.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //         vulHost.evaluation = vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
  //         vulHost.vulnerabilites.push({
  //           text: vul.name || '',
  //           style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //         });
  //         hostMap4FilteredPdf[host.id] = vulHost;
  //       }
  //     });
  //     vul.images.forEach(image => {
  //       if (
  //         vul.images &&
  //         Array.isArray(vul.images) &&
  //         vul.images.length > 0 &&
  //         advFilter.imageName
  //       ) {
  //         let patterns = advFilter.imageName
  //           .split(',')
  //           .map(item => item.trim());
  //         if (new RegExp(patterns.join('|')).test(image.display_name)) {
  //           let vulImage = imageMap4FilteredPdf[image.id];
  //           if (vulImage) {
  //             vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //             vulImage.medium +=
  //               vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //             vulImage.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //             vulImage.evaluation =
  //               vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
  //             vulImage.vulnerabilites.push({
  //               text: vul.name || '',
  //               style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //             });
  //           } else {
  //             vulImage = JSON.parse(JSON.stringify(vulImageInit));
  //             vulImage.image_name = image.display_name || '';
  //             vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //             vulImage.medium +=
  //               vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //             vulImage.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //             vulImage.evaluation =
  //               vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
  //             vulImage.vulnerabilites.push({
  //               text: vul.name || '',
  //               style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //             });
  //           }
  //           imageMap4FilteredPdf[image.id] = vulImage;
  //         }
  //       } else {
  //         let vulImage = JSON.parse(JSON.stringify(vulImageInit));
  //         vulImage.image_name = image.display_name || '';
  //         vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //         vulImage.medium += vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //         vulImage.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //         vulImage.evaluation =
  //           vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
  //         vulImage.vulnerabilites.push({
  //           text: vul.name || '',
  //           style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //         });
  //         imageMap4FilteredPdf[image.id] = vulImage;
  //       }
  //     });
  //   });
  //   grids[0] = Object.values(workloadMap4FilteredPdf);
  //   grids[1] = Object.values(hostMap4FilteredPdf);
  //   grids[3] = Object.values(imageMap4FilteredPdf);
  //   console.log('grids1: ', JSON.parse(JSON.stringify(grids)));
  //   return grids;
  // };
  //
  // private mergeData4NonFiltered = (masterData, vuls) => {
  //   console.log('Input: ', JSON.parse(JSON.stringify(masterData)), vuls);
  //   let grids = [[], [], [], []]; //workloads, hosts, platforms, images
  //   vuls.forEach(vul => {
  //     if (
  //       vul.workloads &&
  //       Array.isArray(vul.workloads) &&
  //       vul.workloads.length > 0
  //     ) {
  //       vul.workloads.forEach(workload => {
  //         let vulWorkload = masterData.workloadMap4Pdf[workload.id];
  //         if (vulWorkload) {
  //           vulWorkload.vulnerabilites.push({
  //             text: vul.name || '',
  //             style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //           });
  //           vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //           vulWorkload.medium +=
  //             vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //           vulWorkload.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //           vulWorkload.evaluation =
  //             vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
  //           masterData.workloadMap4Pdf[workload.id] = vulWorkload;
  //         }
  //       });
  //     }
  //     if (vul.nodes && Array.isArray(vul.nodes) && vul.nodes.length > 0) {
  //       vul.nodes.forEach(host => {
  //         let vulHost = masterData.hostMap4Pdf[host.id];
  //         if (vulHost) {
  //           vulHost.vulnerabilites.push({
  //             text: vul.name || '',
  //             style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //           });
  //           vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //           vulHost.medium += vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //           vulHost.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //           vulHost.evaluation = vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
  //           masterData.hostMap4Pdf[host.id] = vulHost;
  //         }
  //       });
  //     }
  //     if (
  //       vul.platforms &&
  //       Array.isArray(vul.platforms) &&
  //       vul.platforms.length > 0
  //     ) {
  //       vul.platforms.forEach(platform => {
  //         let vulPlatform = masterData.platformMap4Pdf[platform.id];
  //         if (vulPlatform) {
  //           vulPlatform.vulnerabilites.push({
  //             text: vul.name || '',
  //             style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //           });
  //           vulPlatform.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //           vulPlatform.medium +=
  //             vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //           vulPlatform.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //           masterData.platformMap4Pdf[platform.id] = vulPlatform;
  //         }
  //       });
  //     }
  //     if (vul.images && Array.isArray(vul.images) && vul.images.length > 0) {
  //       let otherVulImageInit = {
  //         image_id: '',
  //         image_name: '',
  //         high: 0,
  //         medium: 0,
  //         low: 0,
  //         evaluation: 0,
  //         vulnerabilites: [],
  //       };
  //       vul.images.forEach(image => {
  //         let vulImage = masterData.imageMap4Pdf[image.id];
  //         if (vulImage) {
  //           vulImage.vulnerabilites.push({
  //             text: vul.name || '',
  //             style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //           });
  //           vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //           vulImage.medium += vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //           vulImage.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //           vulImage.evaluation =
  //             vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
  //           masterData.imageMap4Pdf[image.id] = vulImage;
  //         } else {
  //           let otherVulImage = JSON.parse(JSON.stringify(otherVulImageInit));
  //           otherVulImage.image_id = image.id || '';
  //           otherVulImage.image_name = image.display_name || '';
  //           otherVulImage.vulnerabilites.push({
  //             text: vul.name || '',
  //             style: this.styleMap4Severity[vul.severity.toLowerCase()],
  //           });
  //           otherVulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
  //           otherVulImage.medium +=
  //             vul.severity.toLowerCase() === 'medium' ? 1 : 0;
  //           otherVulImage.low += vul.severity.toLowerCase() === 'low' ? 1 : 0;
  //           otherVulImage.evaluation =
  //             otherVulImage.high > 0 || otherVulImage.medium > 0 ? 1 : 0;
  //           masterData.imageMap4Pdf[image.id] = otherVulImage;
  //         }
  //       });
  //     }
  //   });
  //   grids[0] = Object.values(masterData.workloadMap4Pdf);
  //   grids[1] = Object.values(masterData.hostMap4Pdf);
  //   grids[2] = Object.values(masterData.platformMap4Pdf);
  //   grids[3] = Object.values(masterData.imageMap4Pdf);
  //   console.log('grids: ', JSON.parse(JSON.stringify(grids)));
  //   return grids;
  // };
}
