import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-criterion-description-icon',
  templateUrl: './criterion-description-icon.component.html',
  styleUrls: ['./criterion-description-icon.component.scss']
})
export class CriterionDescriptionIconComponent implements OnInit {

  @Input() criteriaOptions: any;
  @Input() name: string;

  constructor() { }

  ngOnInit(): void {
  }

}
