import { Component, Input, OnInit } from '@angular/core';
import {
  CfgType,
  ComplianceAvailableFilters,
  ComplianceProfileTemplateEntry,
} from '@common/types';

@Component({
  selector: 'app-compliance-profile-templates',
  templateUrl: './compliance-profile-templates.component.html',
  styleUrls: ['./compliance-profile-templates.component.scss'],
})
export class ComplianceProfileTemplatesComponent implements OnInit {
  @Input() templates!: ComplianceProfileTemplateEntry[];
  @Input() hideSystemInit!: boolean;
  @Input() cfgType!: CfgType;
  @Input() availableFilters!: ComplianceAvailableFilters;

  ngOnInit(): void {}
}
