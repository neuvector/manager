import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-vulnerabilities-cell',
  templateUrl: './registry-details-vulnerabilities-cell.component.html',
  styleUrls: ['./registry-details-vulnerabilities-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryDetailsVulnerabilitiesCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  high!: string;
  medium!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.high = params.node.data.high;
    this.medium = params.node.data.high;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
