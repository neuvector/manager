import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-criterion-description-icon',
  templateUrl: './criterion-description-icon.component.html',
  styleUrls: ['./criterion-description-icon.component.scss'],
})
export class CriterionDescriptionIconComponent {
  @Input() criteriaOptions: any;
  @Input() name: string;

  constructor() {}
}
