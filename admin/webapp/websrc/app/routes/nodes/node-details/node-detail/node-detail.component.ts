import { Component, Input, OnInit } from '@angular/core';
import { Host } from '@common/types';

@Component({
  selector: 'app-node-detail',
  templateUrl: './node-detail.component.html',
  styleUrls: ['./node-detail.component.scss'],
})
export class NodeDetailComponent implements OnInit {
  @Input() node!: Host;
  get labels() {
    return Object.keys(this.node.labels);
  }

  constructor() {}

  ngOnInit(): void {}

  hasObject(obj: {}): boolean {
    return obj && !!Object.keys(obj).length;
  }
}
