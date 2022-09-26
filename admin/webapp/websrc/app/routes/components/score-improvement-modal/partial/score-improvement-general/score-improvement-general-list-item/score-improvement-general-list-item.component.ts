import { Component, OnInit } from '@angular/core';
import {
  ScoreImprovementModalService,
  ScoreImprovementModalTemplate,
} from '@services/score-improvement-modal.service';
@Component({
  selector: 'app-score-improvement-general-list-item',
  templateUrl: './score-improvement-general-list-item.component.html',
  styleUrls: ['./score-improvement-general-list-item.component.scss'],
})
export class ScoreImprovementGeneralListItemComponent implements OnInit {
  expanded = {
    serviceRisk: false,
    exposure: false,
    runAsPrivileged: false,
    runAsRoot: false,
    admissionControl: false,
  };
  get rawScore() {
    return this.scoreImprovementModalService.scoreInfo.score;
  }

  constructor(
    private scoreImprovementModalService: ScoreImprovementModalService
  ) {}

  ngOnInit(): void {}

  go(template: ScoreImprovementModalTemplate, event: Event) {
    this.scoreImprovementModalService.go(template);
    event.stopPropagation();
  }

  isComplete(template: ScoreImprovementModalTemplate) {
    switch (template) {
      case 'service-risk':
        return (
          this.rawScore.serviceModeScore + this.rawScore.newServiceModeScore ===
          0
        );
      case 'exposure':
        return this.rawScore.exposureScore === 0;
      case 'run-as-privileged':
        return this.rawScore.privilegedContainerScore === 0;
      case 'run-as-root':
        return this.rawScore.runAsRoot === 0;
      case 'admission-control':
        return this.rawScore.admissionRuleScore === 0;
      default:
        return true;
    }
  }
}
