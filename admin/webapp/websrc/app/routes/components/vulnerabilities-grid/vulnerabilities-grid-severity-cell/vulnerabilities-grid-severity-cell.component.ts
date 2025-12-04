import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  standalone: false,
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
  severityDisplay!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.severity = this.params.data.severity;
    this.severityDisplay = this.utils.getI18Name(this.params.data.severity);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
