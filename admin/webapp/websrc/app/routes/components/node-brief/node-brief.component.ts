import { Component, Input, OnInit } from '@angular/core';
import { Host } from '@common/types';
import { Router } from '@angular/router';


@Component({
  standalone: false,
  selector: 'app-node-brief',
  templateUrl: './node-brief.component.html',
  styleUrls: ['./node-brief.component.scss'],
  
})
export class NodeBriefComponent implements OnInit {
  @Input() host!: Host;

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log(this.host);
  }

  goToGroup = group => {
    this.router.navigate(['/group'], {
      queryParams: { group: encodeURIComponent(group) },
    });
  };
}
