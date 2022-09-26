import { Component, Input, OnInit } from '@angular/core';
import { Host } from '@common/types';

@Component({
  selector: 'app-node-brief',
  templateUrl: './node-brief.component.html',
  styleUrls: ['./node-brief.component.scss'],
})
export class NodeBriefComponent implements OnInit {
  @Input() host!: Host;

  constructor() {}

  ngOnInit(): void {
    console.log(this.host);
  }
}
