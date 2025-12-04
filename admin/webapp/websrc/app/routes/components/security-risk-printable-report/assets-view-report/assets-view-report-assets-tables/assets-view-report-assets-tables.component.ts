import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-assets-view-report-assets-tables',
  templateUrl: './assets-view-report-assets-tables.component.html',
  styleUrls: ['./assets-view-report-assets-tables.component.scss'],
})
export class AssetsViewReportAssetsTablesComponent {
  @Input() masterGrids: any[][];
  @Input() reportPage: string;

  constructor() {}
}
