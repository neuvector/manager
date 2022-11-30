import { Component, OnInit } from '@angular/core';
import {
  ComplianceProfileData,
  ComplianceProfileTemplateData,
  DomainGetResponse,
} from '@common/types';
import { ComplianceProfileService } from '@routes/compliance-profile/compliance-profile.service';

@Component({
  selector: 'app-compliance-profile',
  templateUrl: './compliance-profile.component.html',
  styleUrls: ['./compliance-profile.component.scss'],
})
export class ComplianceProfileComponent implements OnInit {
  complianceProfileData!: {
    template: ComplianceProfileTemplateData;
    profile: ComplianceProfileData;
    domains: DomainGetResponse;
  };
  loaded = false;

  constructor(private complianceProfileService: ComplianceProfileService) {}

  ngOnInit(): void {
    this.complianceProfileService
      .initComplianceProfile()
      .subscribe(profileData => {
        this.complianceProfileData = profileData;
        this.loaded = true;
      });
  }

  resize() {
    this.complianceProfileService.resize();
  }
}
