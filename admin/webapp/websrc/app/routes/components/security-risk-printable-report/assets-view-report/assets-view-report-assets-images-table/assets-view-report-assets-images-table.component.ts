import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';


@Component({
  standalone: false,
  selector: 'app-assets-view-report-assets-images-table',
  templateUrl: './assets-view-report-assets-images-table.component.html',
  styleUrls: ['./assets-view-report-assets-images-table.component.scss'],
  
})
export class AssetsViewReportAssetsImagesTableComponent implements OnInit {
  @Input() images: any[];
  @Input() reportPage: string;
  colourMap: any = MapConstant.colourMap;
  vulRate4Images: string;
  vulImagesCnt: number;
  SEC_ASSETS_REPORT_MAX_ROW = MapConstant.SEC_ASSETS_REPORT_MAX_ROW;

  constructor() {}

  ngOnInit(): void {
    this.vulImagesCnt =
      this.reportPage === 'vulnerabilities'
        ? this.images.length -
          this.images.filter(image => image.high + image.medium === 0).length
        : this.images.length -
          this.images.filter(image => image.complianceCnt === 0).length;
    this.vulRate4Images =
      this.images.length > 0
        ? `${Math.ceil(this.vulImagesCnt / this.images.length) * 100}%`
        : '0%';
  }
}
