import { Component } from '@angular/core';
import {
  ScoreImprovementModalService,
  ScoreImprovementModalTemplate,
} from '@services/score-improvement-modal.service';

@Component({
  standalone: false,
  selector: 'app-score-improvement-general-list-item',
  templateUrl: './score-improvement-general-list-item.component.html',
  styleUrls: ['./score-improvement-general-list-item.component.scss'],
})
export class ScoreImprovementGeneralListItemComponent {
  expanded = {
    serviceRisk: false,
    exposure: false,
    runAsPrivileged: false,
    runAsRoot: false,
    admissionControl: false,
  };
  get rawScore() {
    return this.scoreImprovementModalService.scoreInfo.security_scores;
  }

  constructor(
    private scoreImprovementModalService: ScoreImprovementModalService
  ) {}

  go(template: ScoreImprovementModalTemplate, event: Event) {
    this.scoreImprovementModalService.go(template);
    event.stopPropagation();
  }

  isComplete(template: ScoreImprovementModalTemplate) {
    switch (template) {
      case 'service-risk':
        return (
          this.rawScore.service_mode_score +
            this.rawScore.new_service_mode_score ===
          0
        );
      case 'exposure':
        return this.rawScore.exposure_score === 0;
      case 'run-as-privileged':
        return this.rawScore.privileged_container_score === 0;
      case 'run-as-root':
        return this.rawScore.run_as_root_score === 0;
      case 'admission-control':
        return this.rawScore.admission_rule_score === 0;
      default:
        return true;
    }
  }
}
