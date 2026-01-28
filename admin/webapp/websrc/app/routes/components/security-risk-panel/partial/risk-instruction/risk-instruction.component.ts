import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InternalSystemInfo, RiskInstruction, RiskType } from '@common/types';
import { DashboardService } from '@common/services/dashboard.service';

@Component({
  standalone: false,
  selector: 'app-risk-instruction',
  templateUrl: './risk-instruction.component.html',
  styleUrls: ['./risk-instruction.component.scss'],
})
export class RiskInstructionComponent implements OnInit, OnChanges {
  @Input() details: any;
  @Input() scoreInfo!: InternalSystemInfo;
  @Input() activeIndex: number;

  instructions: Array<RiskInstruction> = new Array(4);
  RiskType = RiskType;

  constructor(
    private translate: TranslateService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.renderRiskInstructionSlide(this.activeIndex);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.switchInstruction(this.activeIndex);
  }

  renderRiskInstructionSlide = (activeIndex: number): void => {
    this.instructions[0] = {
      type: RiskType.Score,
      title: this.translate.instant(
        this.dashboardService.isGoodScore(
          this.scoreInfo.security_scores.security_risk_score
        )
          ? 'dashboard.heading.guideline.titles.MAIN_SCORE_GOOD'
          : 'dashboard.heading.guideline.titles.MAIN_SCORE_NOT_GOOD'
      ),
      description: '',
      active: true,
    };
    this.instructions[1] = {
      type: RiskType.ServiceConn,
      title: this.translate.instant(
        'dashboard.heading.guideline.titles.SERVICE_EXPOSURE'
      ),
      description: this.translate.instant(
        'dashboard.heading.guideline.SERVICE_EXPOSURE'
      ),
      active: false,
    };
    this.instructions[2] = {
      type: RiskType.Exposure,
      title: this.translate.instant(
        'dashboard.heading.guideline.titles.INGRESS_EGRESS'
      ),
      description: this.translate.instant(
        'dashboard.heading.guideline.INGRESS_EGRESS'
      ),
      active: false,
    };
    this.instructions[3] = {
      type: RiskType.Vulnerability,
      title: this.translate.instant(
        'dashboard.heading.guideline.titles.VUL_EXPLOIT'
      ),
      description: this.translate.instant(
        'dashboard.heading.guideline.VUL_EXPLOIT'
      ),
      active: false,
    };
  };

  switchInstruction = activeIndex => {
    let elemCarousel = document.getElementsByClassName('carousel-indicators');
    if (elemCarousel.length > 0) {
      let elCarouselItem = elemCarousel[0].children[
        activeIndex
      ] as HTMLButtonElement;
      elCarouselItem.click();
    }
  };
}
