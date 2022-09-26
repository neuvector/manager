import { Component, Input, OnInit } from '@angular/core';
import { WorkloadRow } from '@services/containers.service';

@Component({
  selector: 'app-container-detail',
  templateUrl: './container-detail.component.html',
  styleUrls: ['./container-detail.component.scss'],
})
export class ContainerDetailComponent implements OnInit {
  @Input() container!: WorkloadRow;
  get labels() {
    return Object.keys(this.container.rt_attributes.labels || {});
  }

  constructor() {}

  ngOnInit(): void {}

  hasObject(obj: {}): boolean {
    return obj && !!Object.keys(obj).length;
  }
}
