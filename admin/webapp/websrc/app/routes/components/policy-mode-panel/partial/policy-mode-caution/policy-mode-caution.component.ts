import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-policy-mode-caution',
  templateUrl: './policy-mode-caution.component.html',
  styleUrls: ['./policy-mode-caution.component.scss']
})
export class PolicyModeCautionComponent implements OnInit {

  @Input() assetType: string;

  constructor() { }

  ngOnInit(): void {
  }

}
