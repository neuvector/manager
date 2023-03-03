import { Component, Input, OnInit } from '@angular/core';
import { Domain } from '@common/types';

@Component({
  selector: 'app-namespace-details',
  templateUrl: './namespace-details.component.html',
  styleUrls: ['./namespace-details.component.scss'],
})
export class NamespaceDetailsComponent implements OnInit {
  @Input() namespace!: Domain;
  get labels() {
    return Object.keys(this.namespace.labels || {});
  }

  constructor() {}

  ngOnInit(): void {}

  hasObject(obj: {}): boolean {
    return obj && !!Object.keys(obj).length;
  }
}
