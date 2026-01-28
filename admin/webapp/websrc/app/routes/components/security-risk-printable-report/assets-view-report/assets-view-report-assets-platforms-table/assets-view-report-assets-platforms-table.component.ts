import { Component, OnInit, Input } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-assets-view-report-assets-platforms-table',
  templateUrl: './assets-view-report-assets-platforms-table.component.html',
  styleUrls: ['./assets-view-report-assets-platforms-table.component.scss'],
})
export class AssetsViewReportAssetsPlatformsTableComponent implements OnInit {
  @Input() platforms: any[];
  @Input() reportPage: string;
  colourMap: any = MapConstant.colourMap;

  constructor() {}

  ngOnInit(): void {
    console.log('platforms', this.platforms);
  }
}
