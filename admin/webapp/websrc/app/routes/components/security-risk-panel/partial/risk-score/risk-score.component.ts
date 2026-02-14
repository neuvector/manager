import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  standalone: false,
  selector: 'app-risk-score',
  templateUrl: './risk-score.component.html',
  styleUrls: ['./risk-score.component.scss'],
})
export class RiskScoreComponent implements OnInit, AfterViewInit {
  @Input() score;
  @Input() nodesCnt;
  @Input() podsCnt;
  gaugeLabel = '';
  gaugeLabelColor = '';
  gaugeColor = '';

  constructor(
    private translate: TranslateService,
    private cd: ChangeDetectorRef,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    let gaugeMetrics = this.utils.getGaugeMetrics(this.score);
    this.gaugeLabel = gaugeMetrics.gaugeLabel;
    this.gaugeLabelColor = gaugeMetrics.gaugeLabelColor;
    this.gaugeColor = gaugeMetrics.gaugeLabelColor;
  }

  ngAfterViewInit(): void {
    this.cd.detectChanges();
  }
}
