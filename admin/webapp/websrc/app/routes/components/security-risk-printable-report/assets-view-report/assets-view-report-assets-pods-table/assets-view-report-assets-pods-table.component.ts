import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-assets-view-report-assets-pods-table',
  templateUrl: './assets-view-report-assets-pods-table.component.html',
  styleUrls: ['./assets-view-report-assets-pods-table.component.scss'],
})
export class AssetsViewReportAssetsPodsTableComponent implements OnInit {
  @Input() pods: any[];
  @Input() reportPage: string;
  colourMap: any = MapConstant.colourMap;
  vulRate4Containers: string;
  vulPodsCnt: number;
  SEC_ASSETS_REPORT_MAX_ROW = MapConstant.SEC_ASSETS_REPORT_MAX_ROW;

  constructor() {}

  ngOnInit(): void {
    this.vulPodsCnt =
      this.reportPage === 'vulnerabilities'
        ? this.pods.length -
          this.pods.filter(pod => pod.high + pod.medium === 0).length
        : this.pods.length -
          this.pods.filter(pod => pod.complianceCnt === 0).length;
    this.vulRate4Containers = this.pods.length
      ? `${Math.ceil(this.vulPodsCnt / this.pods.length) * 100}%`
      : '0%';
  }
}
