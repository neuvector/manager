import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-vulnerabilities-grid-severity-cell',
  templateUrl: './vulnerabilities-grid-severity-cell.component.html',
  styleUrls: ['./vulnerabilities-grid-severity-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VulnerabilitiesGridSeverityCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  severity!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.severity = this.params.data.severity;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
