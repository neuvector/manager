import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-risk-report-grid-location-cell',
  templateUrl: './risk-report-grid-location-cell.component.html',
  styleUrls: ['./risk-report-grid-location-cell.component.scss'],
})
export class RiskReportGridLocationCellComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  index!: number;
  get displayWorkload() {
    return this.params.data.workload_domain
      ? `${this.params.data.workload_domain}: ${this.params.data.workload_name}`
      : this.params.data.workload_name;
  }
  get displayImage() {
    return this.params.data.workload_domain
      ? `${this.params.data.workload_domain}: ${this.params.data.workload_image}`
      : this.params.data.workload_image;
  }
  get displayPlatform() {
    return this.params.data.platform_version
      ? `${this.params.data.platform} (${this.tr.instant(
          'audit.gridHeader.VERSION'
        )}: ${this.params.data.platform_version})`
      : this.params.data.platform;
  }
  get displayItem() {
    let imageIndex = this.params.data.items[this.index];
    return imageIndex.substring(imageIndex.indexOf(':') + 1);
  }

  constructor(private tr: TranslateService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (this.params.data.items) {
      this.index = this.isFind(params.data.items, 'image');
    }
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  isFind(array: string[], key: string) {
    let index = -1;
    array.forEach((elem, idx) => {
      if (elem.split(':')[0].toLowerCase() === key) index = idx;
    });
    return index;
  }
}
