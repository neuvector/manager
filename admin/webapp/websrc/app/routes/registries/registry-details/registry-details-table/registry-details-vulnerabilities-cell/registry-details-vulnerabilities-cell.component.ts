import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
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
  critical: number = 0;
  high: number = 0;
  medium: number = 0;

  constructor(private cd: ChangeDetectorRef) {}

  agInit(params: ICellRendererParams): void {
    this.updateValues(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.updateValues(params);
    this.cd.markForCheck();
    return true;
  }

  private updateValues(params: ICellRendererParams): void {
    this.params = params;
    this.critical = params && params.node?.data ? params.node.data.critical ?? 0 : 0;
    this.high = params && params.node?.data ? params.node.data.high ?? 0 : 0;
    this.medium = params && params.node?.data ? params.node.data.medium ?? 0 : 0;
  }
}
