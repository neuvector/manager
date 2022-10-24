import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  selector: 'app-assets-view-report-assets-pods-table',
  templateUrl: './assets-view-report-assets-pods-table.component.html',
  styleUrls: ['./assets-view-report-assets-pods-table.component.scss']
})
export class AssetsViewReportAssetsPodsTableComponent implements OnInit {

  @Input() pods: any[];
  @Input() reportPage: string;
  colourMap: any = MapConstant.colourMap;
  safeRate4Containers: string;

  constructor() { }

  ngOnInit(): void {
    let safePodsCnt =  this.reportPage === 'vulnerabilities' ?
      this.pods.filter(pod => pod.high + pod.medium === 0).length :
      this.pods.filter(pod => pod.complianceCnt === 0).length;
    this.safeRate4Containers = `${Math.ceil(safePodsCnt / this.pods.length)}%`;
  }

}
