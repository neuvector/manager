import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { UtilsService } from '@common/utils/app.utils';


@Component({
  selector: 'app-risk-score',
  templateUrl: './risk-score.component.html',
  styleUrls: ['./risk-score.component.scss']
})
export class RiskScoreComponent implements OnInit {

  @Input() score;
  @Input() nodesCnt;
  @Input() podsCnt;
  gaugeLabel = "";
  gaugeLabelColor = "";

  constructor(
    private translate: TranslateService,
    private cd: ChangeDetectorRef,
    private utils: UtilsService
  ) { }

  ngOnInit(): void {
     console.log("nodesCnt, podsCnt", this.nodesCnt, this.podsCnt);
  }

  ngAfterViewInit():void {
    this.cd.detectChanges();
  }

  getGaugeColor = (score: number) => {
    let gaugeMetrics = this.utils.getGaugeMetrics(score);
    this.gaugeLabel = gaugeMetrics.gaugeLabel;
    this.gaugeLabelColor = gaugeMetrics.gaugeLabelColor;
    return gaugeMetrics.gaugeLabelColor;
  };

}
