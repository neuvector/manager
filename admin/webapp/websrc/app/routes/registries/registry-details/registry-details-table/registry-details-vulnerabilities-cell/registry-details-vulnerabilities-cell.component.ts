import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-vulnerabilities-cell',
  templateUrl: './registry-details-vulnerabilities-cell.component.html',
  styleUrls: ['./registry-details-vulnerabilities-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryDetailsVulnerabilitiesCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  high!: string;
  medium!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.high = params && params.node.data ? params.node.data.high : 0;
    this.medium = params && params.node.data ? params.node.data.medium : 0;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
