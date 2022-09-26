import { Component, OnInit } from '@angular/core';
import { ComplianceProfileService } from '@routes/compliance-profile/compliance-profile.service';

@Component({
  selector: 'app-compliance-profile',
  templateUrl: './compliance-profile.component.html',
  styleUrls: ['./compliance-profile.component.scss'],
})
export class ComplianceProfileComponent implements OnInit {
  complianceProfileData$ =
    this.complianceProfileService.initComplianceProfile();

  constructor(private complianceProfileService: ComplianceProfileService) {}

  ngOnInit(): void {}

  resize() {
    this.complianceProfileService.resize();
  }
}
