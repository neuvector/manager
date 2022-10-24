import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-assets-view-report-assets-tables',
  templateUrl: './assets-view-report-assets-tables.component.html',
  styleUrls: ['./assets-view-report-assets-tables.component.scss']
})
export class AssetsViewReportAssetsTablesComponent implements OnInit {

  @Input() masterGrids: any[][];
  @Input() reportPage: string;

  constructor() { }

  ngOnInit(): void {
  }

}
