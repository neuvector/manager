import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { BytesPipe } from '@common/pipes/app.pipes';

@Component({
  selector: 'app-assets-view-report-assets-nodes-table',
  templateUrl: './assets-view-report-assets-nodes-table.component.html',
  styleUrls: ['./assets-view-report-assets-nodes-table.component.scss']
})
export class AssetsViewReportAssetsNodesTableComponent implements OnInit {

  @Input() nodes: any[];
  @Input() reportPage: string;
  colourMap: any = MapConstant.colourMap;
  safeRate4Hosts: string;

  constructor() { }

  ngOnInit(): void {
    let safeHostsCnt =  this.reportPage === 'vulnerabilities' ?
      this.nodes.filter(node => node.high + node.medium === 0).length :
      this.nodes.filter(node => node.complianceCnt === 0).length;
    this.safeRate4Hosts = `${Math.ceil(safeHostsCnt / this.nodes.length)}%`;
  }

}
