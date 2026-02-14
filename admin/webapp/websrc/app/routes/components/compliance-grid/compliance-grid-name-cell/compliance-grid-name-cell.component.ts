import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Check } from '@common/types';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-compliance-grid-name-cell',
  templateUrl: './compliance-grid-name-cell.component.html',
  styleUrls: ['./compliance-grid-name-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplianceGridNameCellComponent implements ICellRendererAngularComp {
  params!: any;
  name!: string;
  includeRemediation!: boolean;
  openRemediation!: (data: Check) => void;

  agInit(params: any): void {
    this.params = params;
    this.name = this.params.data.test_number;
    this.includeRemediation = this.params.includeRemediation();
    this.openRemediation = this.params.openRemediation;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
