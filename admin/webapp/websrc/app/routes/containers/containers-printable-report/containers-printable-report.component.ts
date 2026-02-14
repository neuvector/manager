import { Component, Input } from '@angular/core';
import { WorkloadV2 } from '@common/types';

@Component({
  standalone: false,
  selector: 'app-containers-printable-report',
  templateUrl: './containers-printable-report.component.html',
  styleUrls: ['./containers-printable-report.component.scss'],
})
export class ContainersPrintableReportComponent {
  private _containers!: WorkloadV2[];

  quarantineReasonsDistribution!: Map<string, number>;

  @Input() set containers(containers) {
    this._containers = containers;
    this.genDistribution();
  }

  get containers() {
    return this._containers;
  }

  constructor() {}

  mapEntries(map: Map<string, number>) {
    return Array.from(map.entries());
  }

  genDistribution() {
    const quarantineReasonsMap = new Map();
    let userConfig = 0,
      ruleTriggered = 0;
    this._containers.forEach(container => {
      if (
        !container.security.quarantine_reason ||
        container.security.quarantine_reason == 'user-configured'
      ) {
        userConfig = userConfig + 1;
      } else {
        ruleTriggered = ruleTriggered + 1;
      }
    });

    quarantineReasonsMap.set('user-configured', userConfig);
    quarantineReasonsMap.set('rule-triggered', ruleTriggered);
    this.quarantineReasonsDistribution = new Map(
      [...quarantineReasonsMap]
        .filter(a => a[1])
        .sort((a, b) => a[1] - b[1])
        .reverse()
    );
  }
}
