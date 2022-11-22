import { Component, ViewChild, ElementRef } from '@angular/core';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { VulnerabilityViewPdfService } from './pdf-generation/vulnerability-view-pdf.service';
import { VulnerabilitiesCsvService } from './csv-generation/vulnerabilities-csv.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { VulnerabilitiesFilterService } from './vulnerabilities.filter.service';
import { MapConstant } from '@common/constants/map.constant';
import { i18nPdfTranslateService } from './pdf-generation/i18n-pdf-transalte.service';

@Component({
  selector: 'app-vulnerabilities',
  templateUrl: './vulnerabilities.component.html',
  styleUrls: ['./vulnerabilities.component.scss'],
})
export class VulnerabilitiesComponent {
  assetViewPdfProgress$ = this.assetsViewPdfService.progress$;
  vulnerabilityViewPdfProgress$ = this.vulnerabilityViewPdfService.progress$;
  vulnerabilitiesData$ = this.vulnerabilitiesService.initVulnerability();
  private _switchClusterSubscription;
  vulnerabilitiesList: any[] = [];
  masterData: any;
  masterGrids: any[][] = [];
  isFiltered: boolean = false;
  advFilter: any;
  isPrinting: boolean = false;
  isPrintingAssets: boolean = false;
  statisticCharts: any = {
    node: null,
    image: null,
  };
  @ViewChild('vulnerabilityViewReport') printableReportView!: ElementRef;
  @ViewChild('assetsViewReport') printableReportViewAssets!: ElementRef;

  constructor(
    private vulnerabilitiesService: VulnerabilitiesService,
    private assetsViewPdfService: AssetsViewPdfService,
    private vulnerabilityViewPdfService: VulnerabilityViewPdfService,
    private vulnerabilitiesCsvService: VulnerabilitiesCsvService,
    private multiClusterService: MultiClusterService,
    private i18nPdfTranslateService: i18nPdfTranslateService,
    private vulnerabilitiesFilterService: VulnerabilitiesFilterService
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

  refresh() {
    this.vulnerabilitiesService.refresh();
  }

  downloadVulnerabilityPDF() {
    this.vulnerabilityViewPdfService.downloadPdf();
  }

  downloadCsv() {
    this.vulnerabilitiesCsvService.downloadCsv();
  }

  downloadAssetsPDF() {
    this.assetsViewPdfService.downloadPdf();
  }

  printVulnerabilityPDF() {
    this.vulnerabilitiesList =
      this.vulnerabilitiesFilterService.filteredCis.length >=
      MapConstant.REPORT_TABLE_ROW_LIMIT
        ? this.vulnerabilitiesList.slice(0, this.vulnerabilitiesList.length)
        : this.vulnerabilitiesFilterService.filteredCis;
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
  }

  printAssetsPDF() {
    this.masterData = {
      workloadMap4Pdf: this.vulnerabilitiesService.workloadMap4Pdf,
      hostMap4Pdf: this.vulnerabilitiesService.hostMap4Pdf,
      platformMap4Pdf: this.vulnerabilitiesService.platformMap4Pdf,
      imageMap4Pdf: this.vulnerabilitiesService.imageMap4Pdf,
    };
    this.vulnerabilitiesList =
      this.vulnerabilitiesFilterService.filteredCis.length >=
      MapConstant.REPORT_TABLE_ROW_LIMIT
        ? this.vulnerabilitiesList.slice(0, this.vulnerabilitiesList.length)
        : this.vulnerabilitiesFilterService.filteredCis;
    this.isFiltered = this.vulnerabilitiesFilterService.filtered;
    this.advFilter = this.vulnerabilitiesFilterService.advFilter;

    this.masterGrids = this.prepareDetails(
      this.masterData,
      this.vulnerabilitiesList,
      this.isFiltered,
      this.advFilter
    );

    this.isPrintingAssets = true;
    setInterval(() => {
      if (this.printableReportViewAssets) {
        window.print();
        this.isPrintingAssets = false;
      }
    }, 500);
  }

  private prepareDetails = (masterData, vuls, isFiltered, advFilter) => {
    if (isFiltered) {
      return this.prepareData4Filtered(masterData, vuls, advFilter);
    } else {
      return this.mergeData4NonFiltered(masterData, vuls);
    }
  };

  private prepareData4Filtered = (masterData, vuls, advFilter) => {
    let grids = [[], [], [], []];
    let workloadMap4FilteredPdf = {};
    let hostMap4FilteredPdf = {};
    let imageMap4FilteredPdf = {};
    vuls.forEach(vul => {
      if (
        vul.workloads &&
        Array.isArray(vul.workloads) &&
        vul.workloads.length > 0 &&
        (advFilter.containerName ||
          advFilter.serviceName ||
          advFilter.selectedDomains.length > 0)
      ) {
        let vulWorkloadInit = {
          pod_name: '',
          domain: '',
          applications: [],
          policy_mode: '',
          service_group: '',
          scanned_at: '',
          high: 0,
          medium: 0,
          evaluation: 0,
          vulnerabilites: [],
        };
        let patterns = advFilter.containerName
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        let servicePatterns = advFilter.serviceName
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
        let domainPatterns = advFilter.selectedDomains
          .map(item => item.name.trim())
          .filter(item => item.length > 0);
        console.log('domainPatterns: ', servicePatterns);
        vul.workloads.forEach(workload => {
          if (masterData.workloadMap4Pdf[workload.id])
            console.log(
              'workloads: ',
              masterData.workloadMap4Pdf[workload.id].service_group,
              new RegExp(domainPatterns.join('|')).test(
                masterData.workloadMap4Pdf[workload.id].service_group
              )
            );
          if (
            ((patterns.length > 0 &&
              new RegExp(patterns.join('|')).test(workload.display_name)) ||
              patterns.length === 0) &&
            ((servicePatterns.length > 0 &&
              masterData.workloadMap4Pdf[workload.id] &&
              new RegExp(servicePatterns.join('|')).test(
                masterData.workloadMap4Pdf[workload.id].service_group.substring(
                  3
                )
              )) ||
              servicePatterns.length === 0) &&
            ((domainPatterns.length > 0 &&
              masterData.workloadMap4Pdf[workload.id] &&
              new RegExp(domainPatterns.join('|')).test(
                masterData.workloadMap4Pdf[workload.id].domain
              )) ||
              domainPatterns.length === 0)
          ) {
            console.log(
              'workloads_1: ',
              masterData.workloadMap4Pdf[workload.id].service_group,
              new RegExp(domainPatterns.join('|')).test(
                masterData.workloadMap4Pdf[workload.id].service_group
              )
            );
            let vulWorkload = workloadMap4FilteredPdf[workload.id];
            if (vulWorkload) {
              vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulWorkload.medium +=
                vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulWorkload.evaluation =
                vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
              vulWorkload.vulnerabilites.push({
                text: vul.name,
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            } else {
              vulWorkload = JSON.parse(JSON.stringify(vulWorkloadInit));
              let workloadInfo = masterData.workloadMap4Pdf[workload.id];
              vulWorkload.pod_name = workload.display_name || '';
              vulWorkload.domain = workloadInfo.domain || '';
              vulWorkload.applications = workloadInfo.applications || '';
              vulWorkload.policy_mode = workload.policy_mode || '';
              vulWorkload.service_group = workloadInfo.service_group || '';
              vulWorkload.scanned_at = workloadInfo.scanned_at || '';
              vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulWorkload.medium +=
                vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulWorkload.evaluation =
                vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
              vulWorkload.vulnerabilites.push({
                text: vul.name || '',
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            }
            workloadMap4FilteredPdf[workload.id] = vulWorkload;
          }
        });
      }
      if (
        vul.nodes &&
        Array.isArray(vul.nodes) &&
        vul.nodes.length > 0 &&
        advFilter.nodeName
      ) {
        let vulHostInit = {
          name: '',
          os: '',
          kernel: '',
          cpus: 0,
          memory: 0,
          containers: 0,
          policy_mode: '',
          scanned_at: '',
          high: 0,
          medium: 0,
          evaluation: 0,
          vulnerabilites: [],
        };
        let patterns = advFilter.nodeName.split(',').map(item => item.trim());
        vul.nodes.forEach(host => {
          if (new RegExp(patterns.join('|')).test(host.display_name)) {
            let vulHost = hostMap4FilteredPdf[host.id];
            if (vulHost) {
              vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulHost.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulHost.evaluation =
                vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
              vulHost.vulnerabilites.push({
                text: vul.name,
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            } else {
              vulHost = JSON.parse(JSON.stringify(vulHostInit));
              let hostInfo = masterData.hostMap4Pdf[host.id];
              vulHost.name = host.display_name || '';
              vulHost.os = hostInfo.os || '';
              vulHost.kernel = hostInfo.kernel || '';
              vulHost.cpus = hostInfo.cpus || '';
              vulHost.memory = hostInfo.memory || '';
              vulHost.containers = hostInfo.containers || '';
              vulHost.policy_mode = host.policy_mode || '';
              vulHost.scanned_at = hostInfo.scanned_at || '';
              vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulHost.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulHost.evaluation =
                vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
              vulHost.vulnerabilites.push({
                text: vul.name || '',
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            }
            hostMap4FilteredPdf[host.id] = vulHost;
          }
        });
      }
      if (
        vul.images &&
        Array.isArray(vul.images) &&
        vul.images.length > 0 &&
        advFilter.imageName
      ) {
        let vulImageInit = {
          image_name: '',
          high: 0,
          medium: 0,
          vulnerabilites: [],
        };
        let patterns = advFilter.imageName.split(',').map(item => item.trim());
        vul.images.forEach(image => {
          if (new RegExp(patterns.join('|')).test(image.display_name)) {
            let vulImage = imageMap4FilteredPdf[image.id];
            if (vulImage) {
              vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulImage.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulImage.evaluation =
                vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
              vulImage.vulnerabilites.push({
                text: vul.name || '',
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            } else {
              vulImage = JSON.parse(JSON.stringify(vulImageInit));
              vulImage.image_name = image.display_name || '';
              vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
              vulImage.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
              vulImage.evaluation =
                vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
              vulImage.vulnerabilites.push({
                text: vul.name || '',
                style:
                  vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
              });
            }
            imageMap4FilteredPdf[image.id] = vulImage;
          }
        });
      }
    });
    grids[0] = Object.values(workloadMap4FilteredPdf);
    grids[1] = Object.values(hostMap4FilteredPdf);
    grids[3] = Object.values(imageMap4FilteredPdf);
    return grids;
  };

  private mergeData4NonFiltered = (masterData, vuls) => {
    console.log('Input: ', JSON.parse(JSON.stringify(masterData)), vuls);
    let grids = [[], [], [], []]; //workloads, hosts, platforms, images
    vuls.forEach(vul => {
      if (
        vul.workloads &&
        Array.isArray(vul.workloads) &&
        vul.workloads.length > 0
      ) {
        vul.workloads.forEach(workload => {
          let vulWorkload = masterData.workloadMap4Pdf[workload.id];
          if (vulWorkload) {
            vulWorkload.vulnerabilites.push({
              text: vul.name || '',
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            vulWorkload.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            vulWorkload.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
            vulWorkload.evaluation =
              vulWorkload.high > 0 || vulWorkload.medium > 0 ? 1 : 0;
            masterData.workloadMap4Pdf[workload.id] = vulWorkload;
          }
        });
      }
      if (vul.nodes && Array.isArray(vul.nodes) && vul.nodes.length > 0) {
        vul.nodes.forEach(host => {
          let vulHost = masterData.hostMap4Pdf[host.id];
          if (vulHost) {
            vulHost.vulnerabilites.push({
              text: vul.name || '',
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            vulHost.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            vulHost.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
            vulHost.evaluation = vulHost.high > 0 || vulHost.medium > 0 ? 1 : 0;
            masterData.hostMap4Pdf[host.id] = vulHost;
          }
        });
      }
      if (
        vul.platforms &&
        Array.isArray(vul.platforms) &&
        vul.platforms.length > 0
      ) {
        vul.platforms.forEach(platform => {
          let vulPlatform = masterData.platformMap4Pdf[platform.id];
          if (vulPlatform) {
            vulPlatform.vulnerabilites.push({
              text: vul.name || '',
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            vulPlatform.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            vulPlatform.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
            masterData.platformMap4Pdf[platform.id] = vulPlatform;
          }
        });
      }
      if (vul.images && Array.isArray(vul.images) && vul.images.length > 0) {
        let otherVulImageInit = {
          image_id: '',
          image_name: '',
          high: 0,
          medium: 0,
          evaluation: 0,
          vulnerabilites: [],
        };
        vul.images.forEach(image => {
          let vulImage = masterData.imageMap4Pdf[image.id];
          if (vulImage) {
            vulImage.vulnerabilites.push({
              text: vul.name || '',
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            vulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            vulImage.medium += vul.severity.toLowerCase() === 'high' ? 0 : 1;
            vulImage.evaluation =
              vulImage.high > 0 || vulImage.medium > 0 ? 1 : 0;
            masterData.imageMap4Pdf[image.id] = vulImage;
          } else {
            let otherVulImage = JSON.parse(JSON.stringify(otherVulImageInit));
            otherVulImage.image_id = image.id || '';
            otherVulImage.image_name = image.display_name || '';
            otherVulImage.vulnerabilites.push({
              text: vul.name || '',
              style:
                vul.severity.toLowerCase() === 'high' ? 'danger' : 'warning',
            });
            otherVulImage.high += vul.severity.toLowerCase() === 'high' ? 1 : 0;
            otherVulImage.medium +=
              vul.severity.toLowerCase() === 'high' ? 0 : 1;
            otherVulImage.evaluation =
              otherVulImage.high > 0 || otherVulImage.medium > 0 ? 1 : 0;
            masterData.imageMap4Pdf[image.id] = otherVulImage;
          }
        });
      }
    });
    grids[0] = Object.values(masterData.workloadMap4Pdf);
    grids[1] = Object.values(masterData.hostMap4Pdf);
    grids[2] = Object.values(masterData.platformMap4Pdf);
    grids[3] = Object.values(masterData.imageMap4Pdf);
    console.log('grids: ', JSON.parse(JSON.stringify(grids)));
    return grids;
  };
}
