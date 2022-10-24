import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-assets-view-report',
  templateUrl: './assets-view-report.component.html',
  styleUrls: ['./assets-view-report.component.scss']
})
export class AssetsViewReportComponent implements OnInit {

  @Input() reportPage: string;
  @Input() masterGrids: any[][];
  @Input() dictionaryData: any;

  constructor() { }

  ngOnInit(): void {
    if (this.reportPage === 'vulnerabilities') {
      this.masterGrids[0] = this.masterGrids[0].sort((a, b) => {
        return b.high + b.medium - (a.high + a.medium);
      });

      this.masterGrids[1] = this.masterGrids[1].sort((a, b) => {
        return b.high + b.medium - (a.high + a.medium);
      });

      this.masterGrids[2] = this.masterGrids[2].sort((a, b) => {
        return b.high + b.medium - (a.high + a.medium);
      });

      this.masterGrids[3] = this.masterGrids[3].sort((a, b) => {
        return b.high + b.medium - (a.high + a.medium);
      });
    } else {
      this.masterGrids[0] = this.masterGrids[0].sort((a, b) => {
        return b.complianceCnt - a.complianceCnt;
      });

      this.masterGrids[1] = this.masterGrids[1].sort((a, b) => {
        return b.complianceCnt - a.complianceCnt;
      });

      this.masterGrids[2] = this.masterGrids[2].sort((a, b) => {
        return b.complianceCnt - a.complianceCnt;
      });

      this.masterGrids[3] = this.masterGrids[3].sort((a, b) => {
        return b.complianceCnt - a.complianceCnt;
      });
    }
  }

}
