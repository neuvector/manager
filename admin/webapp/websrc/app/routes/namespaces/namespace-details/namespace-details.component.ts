import { Component, Input } from '@angular/core';
import { Domain } from '@common/types';


@Component({
  standalone: false,
  selector: 'app-namespace-details',
  templateUrl: './namespace-details.component.html',
  styleUrls: ['./namespace-details.component.scss'],
  
})
export class NamespaceDetailsComponent {
  @Input() namespace!: Domain;
  get labels() {
    return Object.keys(this.namespace.labels || {});
  }

  constructor() {}

  hasObject(obj: {}): boolean {
    return obj && !!Object.keys(obj).length;
  }
}
