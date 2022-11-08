import { Component, Input, OnInit } from '@angular/core';
import {WorkloadV2} from "@common/types";

@Component({
  selector: 'app-containers-printable-report',
  templateUrl: './containers-printable-report.component.html',
  styleUrls: ['./containers-printable-report.component.scss']
})
export class ContainersPrintableReportComponent implements OnInit {

  private _containers!: WorkloadV2[];

  quarantineReasonsDistribution!: Map<string, number>;

  @Input() set containers(containers) {
    this._containers = containers;
    this.genDistribution();
  }

  get containers(){
    return this._containers;
  }

  constructor() { }

  ngOnInit(): void {
  }

  mapEntries(map: Map<string, number>) {
    return Array.from(map.entries());
  }

  genDistribution() {
    const quarantineReasonsMap = new Map();
    quarantineReasonsMap.set("user-configured",this._containers.length);
    quarantineReasonsMap.set("rule-triggered", 0);
    this.quarantineReasonsDistribution = new Map(
      [...quarantineReasonsMap]
        .filter(a => a[1])
        .sort((a, b) => a[1] - b[1])
        .reverse()
    );
    console.log(this.quarantineReasonsDistribution);
  }

}
