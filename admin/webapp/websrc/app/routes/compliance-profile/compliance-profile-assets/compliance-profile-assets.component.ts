import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-compliance-profile-assets',
  templateUrl: './compliance-profile-assets.component.html',
  styleUrls: ['./compliance-profile-assets.component.scss'],
})
export class ComplianceProfileAssetsComponent implements OnInit {
  @Input() domains!: any;

  constructor() {}

  ngOnInit(): void {}
}
