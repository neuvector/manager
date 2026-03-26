import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { TranslateModule } from '@ngx-translate/core';
import { GlobalConstant } from 'app/common/constants/global.constant';

@Component({
  standalone: true,
  selector: 'app-registry-details-os-cell',
  templateUrl: './registry-details-os-cell.html',
  styleUrl: './registry-details-os-cell.scss',
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryDetailsOsCell implements ICellRendererAngularComp {
  private params!: ICellRendererParams;
  os!: string;
  os_scan_status!: string;
  OS_STATUS = GlobalConstant.OS_STATUS;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.os =
      params && params.node.data
        ? params.node.data.base_os
          ? params.node.data.base_os
          : '-'
        : '';
    this.os_scan_status =
      params && params.node.data
        ? params.node.data.os_scan_status
          ? params.node.data.os_scan_status
          : this.OS_STATUS.UNKNOWN
        : '';
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    return true;
  }
}
