import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { BytesPipe } from '@common/pipes/app.pipes';

@Component({
  standalone: false,
  selector: 'app-assets-view-report-assets-nodes-table',
  templateUrl: './assets-view-report-assets-nodes-table.component.html',
  styleUrls: ['./assets-view-report-assets-nodes-table.component.scss'],
})
export class AssetsViewReportAssetsNodesTableComponent implements OnInit {
  @Input() nodes: any[];
  @Input() reportPage: string;
  colourMap: any = MapConstant.colourMap;
  vulRate4Hosts: string;
  vulHostsCnt: number;
  SEC_ASSETS_REPORT_MAX_ROW = MapConstant.SEC_ASSETS_REPORT_MAX_ROW;

  constructor() {}

  ngOnInit(): void {
    this.vulHostsCnt =
      this.reportPage === 'vulnerabilities'
        ? this.nodes.length -
          this.nodes.filter(node => node.high + node.medium === 0).length
        : this.nodes.length -
          this.nodes.filter(node => node.complianceCnt === 0).length;
    this.vulRate4Hosts = this.nodes.length
      ? `${Math.ceil(this.vulHostsCnt / this.nodes.length) * 100}%`
      : '0%';
  }
}
