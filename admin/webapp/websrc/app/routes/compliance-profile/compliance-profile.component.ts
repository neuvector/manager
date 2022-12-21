import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ComplianceProfileData,
  ComplianceProfileTemplateData,
} from '@common/types';
import { AuthUtilsService } from '@common/utils/auth.utils';
import {
  ComplianceProfileService,
  DomainResponse,
} from '@routes/compliance-profile/compliance-profile.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-compliance-profile',
  templateUrl: './compliance-profile.component.html',
  styleUrls: ['./compliance-profile.component.scss'],
})
export class ComplianceProfileComponent implements OnInit, OnDestroy {
  private _switchClusterSubscription!: Subscription;
  complianceProfileData!: {
    template: ComplianceProfileTemplateData;
    profile: ComplianceProfileData;
    domains: DomainResponse;
  };
  loaded = false;
  get isNamespaceUser() {
    return this.authUtilsService.userPermission.isNamespaceUser;
  }

  constructor(
    private complianceProfileService: ComplianceProfileService,
    private multiClusterService: MultiClusterService,
    private authUtilsService: AuthUtilsService
  ) {}

  ngOnInit(): void {
    this.complianceProfileService
      .initComplianceProfile()
      .subscribe(profileData => {
        this.complianceProfileData = profileData;
        this.loaded = true;
      });
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        this.complianceProfileService.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  resize() {
    this.complianceProfileService.resize();
  }
}
