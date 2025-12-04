import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ComplianceAvailableFilters,
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
  standalone: false,
  selector: 'app-compliance-profile',
  templateUrl: './compliance-profile.component.html',
  styleUrls: ['./compliance-profile.component.scss'],
  
})
export class ComplianceProfileComponent implements OnInit, OnDestroy {
  complianceProfileData!: {
    template: ComplianceProfileTemplateData;
    profile: ComplianceProfileData;
    domains: DomainResponse;
    filters: ComplianceAvailableFilters;
  };
  loaded = false;
  refreshingProfile = false;
  isNamespaceUser!: boolean;

  private _getClustersFinishSubscription!: Subscription;

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
        this.isNamespaceUser =
          this.authUtilsService.userPermission.isNamespaceUser;
      });

    this._getClustersFinishSubscription =
      this.multiClusterService.onGetClustersFinishEvent$.subscribe(() => {
        this.complianceProfileService
          .initComplianceProfile()
          .subscribe(profileData => {
            this.complianceProfileData = profileData;
            this.loaded = true;
            this.isNamespaceUser =
              this.authUtilsService.userPermission.isNamespaceUser;
            this.refreshingProfile = false;
          });
      });
  }

  ngOnDestroy(): void {
    if (this._getClustersFinishSubscription) {
      this._getClustersFinishSubscription.unsubscribe();
    }
  }

  resize() {
    this.complianceProfileService.resize();
  }
}
