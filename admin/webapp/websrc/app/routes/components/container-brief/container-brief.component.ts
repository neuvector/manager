import { Component, Input } from '@angular/core';
import { Workload } from '@common/types';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-container-brief',
  templateUrl: './container-brief.component.html',
  styleUrls: ['./container-brief.component.scss'],
})
export class ContainerBriefComponent {
  @Input() container!: Workload;
  @Input() hasApps!: boolean;
  @Input() hasInterfaces!: boolean;
  @Input() apps!: any;

  isScanStarted4Pod = false;

  constructor(private router: Router) {}

  goToGroup = group => {
    this.router.navigate(['/group'], {
      queryParams: { group: encodeURIComponent(group) },
    });
  };
}
