import { Component } from '@angular/core';
import { ComplianceService } from './compliance.service';
import { AssetsViewPdfService } from './pdf-generation/assets-view-pdf.service';
import { ComplianceViewPdfService } from './pdf-generation/compliance-view-pdf.service';
import { ComplianceCsvService } from './csv-generation/compliance-csv.service';

@Component({
  selector: 'app-compliance',
  templateUrl: './compliance.component.html',
  styleUrls: ['./compliance.component.scss'],
})
export class ComplianceComponent {
  assetViewPdfProgress$ = this.assetsViewPdfService.progress$;
  complianceViewPdfProgress$ = this.complianceViewPdfService.progress$;
  complianceData$ = this.complianceService.initCompliance();

  constructor(
    private complianceService: ComplianceService,
    private assetsViewPdfService: AssetsViewPdfService,
    private complianceViewPdfService: ComplianceViewPdfService,
    private complianceCsvService: ComplianceCsvService
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
}
