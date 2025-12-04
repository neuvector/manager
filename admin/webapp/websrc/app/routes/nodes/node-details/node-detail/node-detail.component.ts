import { Component, Input } from '@angular/core';
import { Host } from '@common/types';


@Component({
  standalone: false,
  selector: 'app-node-detail',
  templateUrl: './node-detail.component.html',
  styleUrls: ['./node-detail.component.scss'],
  
})
export class NodeDetailComponent {
  @Input() node!: Host;
  get labels() {
    return Object.keys(this.node.labels);
  }

  constructor() {}

  hasObject(obj: {}): boolean {
    return obj && !!Object.keys(obj).length;
  }
}
