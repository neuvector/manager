import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ComplianceCsvService } from '../../../csv-generation/compliance-csv.service';

@Component({
  standalone: false,
  selector: 'app-compliance-items-table-csv-cell',
  templateUrl: './compliance-items-table-csv-cell.component.html',
  styleUrls: ['./compliance-items-table-csv-cell.component.scss'],
})
export class ComplianceItemsTableCsvCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor(private complianceCsvService: ComplianceCsvService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  downloadCsv() {
    this.complianceCsvService.downloadCsv(this.params.node.data);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
