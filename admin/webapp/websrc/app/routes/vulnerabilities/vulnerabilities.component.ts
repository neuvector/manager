import { Component } from '@angular/core';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { VulnerabilityViewPdfService } from './pdf-generation/vulnerability-view-pdf.service';
import { VulnerabilitiesCsvService } from './csv-generation/vulnerabilities-csv.service';
import {MultiClusterService} from "@services/multi-cluster.service";

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

  constructor(
    private vulnerabilitiesService: VulnerabilitiesService,
    private assetsViewPdfService: AssetsViewPdfService,
    private vulnerabilityViewPdfService: VulnerabilityViewPdfService,
    private vulnerabilitiesCsvService: VulnerabilitiesCsvService,
    private multiClusterService: MultiClusterService
  ) {
    //refresh the page when it switched to a remote cluster
    this._switchClusterSubscription = this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
      this.refresh();
    });
  }

  ngOnDestroy(): void {
    if(this._switchClusterSubscription){
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
}
