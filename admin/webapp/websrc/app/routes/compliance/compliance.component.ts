import {
  Component,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ComplianceService } from './compliance.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { ComplianceViewPdfService } from './pdf-generation/compliance-view-pdf.service';
import { ComplianceCsvService } from './csv-generation/compliance-csv.service';
import { i18nPdfTranslateService } from './pdf-generation/i18n-pdf-translate.service';
import { ComplianceFilterService } from './compliance.filter.service';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  selector: 'app-compliance',
  templateUrl: './compliance.component.html',
  styleUrls: ['./compliance.component.scss'],
})
export class ComplianceComponent {
  assetViewPdfProgress$ = this.assetsViewPdfService.progress$;
  complianceViewPdfProgress$ = this.complianceViewPdfService.progress$;
  complianceData$ = this.complianceService.initCompliance();
  masterData: any;
  masterGrids: any[][];
  isFiltered: boolean = false;
  advFilter: any;
  isPrinting: boolean = false;
  isPrintingAssets: boolean = false;
  complianceList: any[] = [];
  statisticCharts: any = {
    node: null,
    image: null
  };
  @ViewChild('complianceViewReport') printableReportView: ElementRef;
  @ViewChild('assetsViewReport') printableReportViewAssets: ElementRef;

  constructor(
    private complianceService: ComplianceService,
    private assetsViewPdfService: AssetsViewPdfService,
    private complianceViewPdfService: ComplianceViewPdfService,
    private complianceCsvService: ComplianceCsvService,
    private i18nPdfTranslateService: i18nPdfTranslateService,
    private complianceFilterService: ComplianceFilterService
  ) {}

  refresh() {
    this.complianceService.refresh();
  }

  downloadCompliancePDF() {
    this.complianceViewPdfService.downloadPdf();
  }

  downloadCsv() {
    this.complianceCsvService.downloadCsv();
  }

  downloadAssetsPDF() {
    this.assetsViewPdfService.downloadPdf();
  }

  printCompliancePDF() {
    // this.vulnerabilitiesList =
    //   this.vulnerabilitiesFilterService.filteredCis.length >= MapConstant.REPORT_TABLE_ROW_LIMIT ?
    //   this.vulnerabilitiesList.slice(0, this.vulnerabilitiesList.length) :
    //   this.vulnerabilitiesFilterService.filteredCis;
    this.complianceList = this.complianceFilterService.filteredCis.map(compliance => {
      compliance.workloads = compliance.workloads.filter(workload =>
        this.complianceFilterService.namespaceFilter(workload)
      );
      return compliance;
    });
    this.statisticCharts = {
      node: (document.getElementById("complinceNodesBarPDF") as HTMLCanvasElement)
        .toDataURL(),
      image: (document.getElementById("complinceImagesBarPDF") as HTMLCanvasElement)
        .toDataURL()
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
      workloadMap4Pdf: this.complianceService.workloadMap4Pdf,
      hostMap4Pdf: this.complianceService.hostMap4Pdf,
      platformMap4Pdf: this.complianceService.platformMap4Pdf,
      imageMap4Pdf: this.complianceService.imageMap4Pdf
    };
    this.complianceList = this.complianceFilterService.filteredCis.map(compliance => {
      compliance.workloads = compliance.workloads.filter(workload =>
        this.complianceFilterService.namespaceFilter(workload)
      );
      return compliance;
    });
    this.isFiltered = this.complianceFilterService.filtered;
    this.advFilter = this.complianceFilterService.advFilter;

    this.masterGrids = this.prepareDetails(
      this.masterData,
      this.complianceList,
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

  private prepareDetails = (
    masterData,
    complianceList,
    isFiltered,
    advFilter
  ) => {
    if (isFiltered) {
      return this.prepareData4Filtered(masterData, complianceList, advFilter);
    } else {
      return this.mergeData4NonFiltered(masterData, complianceList);
    }
  };

  private prepareData4Filtered = (
    masterData,
    complianceList,
    advFilter
  ) => {
    let grids = [[], [], [], []];
    let workloadMap4FilteredPdf = {};
    let hostMap4FilteredPdf = {};
    let imageMap4FilteredPdf = {};
    complianceList.forEach(compliance => {
      if (
        compliance.workloads &&
        Array.isArray(compliance.workloads) &&
        compliance.workloads.length > 0 &&
        (advFilter.containerName || advFilter.serviceName || advFilter.selectedDomains.length > 0)
      ) {
        let compWorkloadInit = {
          pod_name: "",
          domain: "",
          applications: [],
          policy_mode: "",
          service_group: "",
          complianceCnt: 0,
          evaluation: 0,
          complianceList: []
        };
        let patterns = advFilter.containerName.split(",").map(item => item.trim()).filter(item => item.length > 0);
        let servicePatterns = advFilter.serviceName.split(",").map(item => item.trim()).filter(item => item.length > 0);
        let domainPatterns = advFilter.selectedDomains.map(item => item.name.trim()).filter(item => item.length > 0);

        compliance.workloads.forEach(workload => {
          if (
            (
              patterns.length > 0 &&
              new RegExp(patterns.join("|")).test(workload.display_name) || patterns.length === 0
            ) &&
            (
              servicePatterns.length > 0 &&
              masterData.workloadMap4Pdf[workload.id] &&
              new RegExp(servicePatterns.join("|")).test(masterData.workloadMap4Pdf[workload.id].service_group.substring(3)) || servicePatterns.length === 0
            ) &&
            (
              domainPatterns.length > 0 &&
              masterData.workloadMap4Pdf[workload.id] &&
              new RegExp(domainPatterns.join("|")).test(masterData.workloadMap4Pdf[workload.id].domain) || domainPatterns.length === 0
            )
          ) {
            let compWorkload = workloadMap4FilteredPdf[workload.id];
            if (compWorkload) {
              compWorkload.complianceCnt++;
              compWorkload.evaluation = compWorkload.complianceCnt > 0 ? 1 : 0;
              compWorkload.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            } else {
              compWorkload = JSON.parse(JSON.stringify(compWorkloadInit));
              let workloadInfo = masterData.workloadMap4Pdf[workload.id];
              compWorkload.pod_name = workload.display_name || "";
              compWorkload.domain = workloadInfo.domain || "";
              compWorkload.applications = workloadInfo.applications || "";
              compWorkload.policy_mode = workload.policy_mode || "";
              compWorkload.service_group = workloadInfo.service_group || "";
              compWorkload.complianceCnt++;
              compWorkload.evaluation = compWorkload.complianceCnt > 0 ? 1 : 0;
              compWorkload.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            }
            workloadMap4FilteredPdf[workload.id] = compWorkload;
          }
        });
      }
      if (compliance.nodes && Array.isArray(compliance.nodes) && compliance.nodes.length > 0 && advFilter.nodeName) {
        let compHostInit = {
          name: "",
          os: "",
          kernel: "",
          cpus: 0,
          memory: 0,
          containers: 0,
          policy_mode: "",
          complianceCnt: 0,
          evaluation: 0,
          complianceList: []
        };
        let patterns = advFilter.nodeName.split(",").map(item => item.trim());
        compliance.nodes.forEach(host => {
          if (new RegExp(patterns.join("|")).test(host.display_name)) {
            let compHost = hostMap4FilteredPdf[host.id];
            if (compHost) {
              compHost.complianceCnt++;
              compHost.evaluation = compHost.complianceCnt > 0 ? 1 : 0;
              compHost.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            } else {
              compHost = JSON.parse(JSON.stringify(compHostInit));
              let hostInfo = masterData.hostMap4Pdf[host.id];
              compHost.name = host.display_name || "";
              compHost.os = hostInfo.os || "";
              compHost.kernel = hostInfo.kernel || "";
              compHost.cpus = hostInfo.cpus || "";
              compHost.memory = hostInfo.memory || "";
              compHost.containers = hostInfo.containers || "";
              compHost.policy_mode = host.policy_mode || "";
              compHost.complianceCnt++;
              compHost.evaluation = compHost.complianceCnt > 0 ? 1 : 0;
              compHost.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            }
            hostMap4FilteredPdf[host.id] = compHost;
          }
        });
      }
      if (compliance.images && Array.isArray(compliance.images) && compliance.images.length > 0 && advFilter.imageName) {
        let compImageInit = {
          image_name: "",
          complianceCnt: 0,
          evaluation: 0,
          complianceList: []
        };
        let patterns = advFilter.imageName.split(",").map(item => item.trim());
        compliance.images.forEach(image => {
          if (new RegExp(patterns.join("|")).test(image.display_name)) {
            let compImage = imageMap4FilteredPdf[image.id];
            if (compImage) {
              compImage.complianceCnt++;
              compImage.evaluation = compImage.complianceCnt > 0 ? 1 : 0;
              compImage.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            } else {
              compImage = JSON.parse(JSON.stringify(compImageInit));
              compImage.image_name = image.display_name || "";
              compImage.complianceCnt++;
              compImage.evaluation = compImage.complianceCnt > 0 ? 1 : 0;
              compImage.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            }
            imageMap4FilteredPdf[image.id] = compImage;
          }
        });
      }
    });
    grids[0] = Object.values(workloadMap4FilteredPdf);
    grids[1] = Object.values(hostMap4FilteredPdf);
    grids[3] = Object.values(imageMap4FilteredPdf);
    return grids;
  };

  private mergeData4NonFiltered = (
    masterData,
    complianceList
  ) => {
    let grids = [[], [], [], []]; //workloads, hosts, platforms, images
    complianceList.forEach(compliance => {
      if (compliance.workloads && Array.isArray(compliance.workloads) && compliance.workloads.length > 0) {
        compliance.workloads.forEach(workload => {
          let compWorkload = masterData.workloadMap4Pdf[workload.id];
          if (compWorkload) {
            compWorkload.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            compWorkload.complianceCnt++;
            compWorkload.evaluation = compWorkload.complianceCnt > 0 ? 1 : 0;
            masterData.workloadMap4Pdf[workload.id] = compWorkload;
          }
        });
      }
      if (compliance.nodes && Array.isArray(compliance.nodes) && compliance.nodes.length > 0) {
        compliance.nodes.forEach(host => {
          let compHost = masterData.hostMap4Pdf[host.id];
          if (compHost) {
            compHost.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            compHost.complianceCnt++;
            compHost.evaluation = compHost.complianceCnt > 0 ? 1 : 0;
            masterData.hostMap4Pdf[host.id] = compHost;
          }
        });
      }
      if (compliance.platforms && Array.isArray(compliance.platforms) && compliance.platforms.length > 0) {
        compliance.platforms.forEach(platform => {
          let compPlatform = masterData.platformMap4Pdf[platform.id];
          if (compPlatform) {
            compPlatform.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            compPlatform.complianceCnt++;
            masterData.hostMap4Pdf[platform.id] = compPlatform;
          }
        });
      }
      if (compliance.images && Array.isArray(compliance.images) && compliance.images.length > 0) {
        let otherCompImageInit = {
          image_id: "",
          image_name: "",
          complianceCnt: 0,
          evaluation: 0,
          complianceList: []
        };
        compliance.images.forEach(image => {
          let compImage = masterData.imageMap4Pdf[image.id];
          if (compImage) {
            compImage.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            compImage.complianceCnt++;
            compImage.evaluation = compImage.complianceCnt > 0 ? 1 : 0;
            masterData.imageMap4Pdf[image.id] = compImage;
          } else {
            let otherCompImage = JSON.parse(JSON.stringify(otherCompImageInit));
            otherCompImage.image_id = image.id;
            otherCompImage.image_name = image.display_name || "";
            otherCompImage.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
            otherCompImage.complianceCnt++;
            otherCompImage.evaluation = otherCompImage.complianceCnt > 0 ? 1 : 0;
            masterData.imageMap4Pdf[image.id] = otherCompImage;
          }
        });
      }
    });
    grids[0] = Object.values(masterData.workloadMap4Pdf);
    grids[1] = Object.values(masterData.hostMap4Pdf);
    grids[2] = Object.values(masterData.platformMap4Pdf);
    grids[3] = Object.values(masterData.imageMap4Pdf);

    console.log("grids: ", grids);
    return grids;
  };
}