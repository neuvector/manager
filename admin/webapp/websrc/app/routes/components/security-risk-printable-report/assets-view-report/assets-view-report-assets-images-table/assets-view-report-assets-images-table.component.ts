import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  selector: 'app-assets-view-report-assets-images-table',
  templateUrl: './assets-view-report-assets-images-table.component.html',
  styleUrls: ['./assets-view-report-assets-images-table.component.scss']
})
export class AssetsViewReportAssetsImagesTableComponent implements OnInit {

  @Input() images: any[];
  @Input() reportPage: string;
  colourMap: any = MapConstant.colourMap;
  safeRate4Images: string;

  constructor() { }

  ngOnInit(): void {
    let safeImagesCnt =  this.reportPage === 'vulnerabilities' ?
      this.images.filter(image => image.high + image.medium === 0).length :
      this.images.filter(image => image.complianceCnt === 0).length;
    this.safeRate4Images = `${Math.ceil(safeImagesCnt / this.images.length)}%`;
  }

}
