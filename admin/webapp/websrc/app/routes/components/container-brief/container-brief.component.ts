import { Component, Input, OnInit } from '@angular/core';
import { Workload } from '@common/types';

@Component({
  selector: 'app-container-brief',
  templateUrl: './container-brief.component.html',
  styleUrls: ['./container-brief.component.scss'],
})
export class ContainerBriefComponent implements OnInit {
  @Input() container!: Workload;
  @Input() hasApps!: boolean;
  @Input() hasInterfaces!: boolean;
  @Input() apps!: any;

  isScanStarted4Pod = false;

  constructor() {}

  ngOnInit(): void {
    console.log(this.container);
  }
}
