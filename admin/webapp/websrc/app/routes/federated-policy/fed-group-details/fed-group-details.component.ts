import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
  Input,
} from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { GroupsComponent } from '@components/groups/groups.component';
import { FederatedConfigurationService } from '@services/federated-configuration.service';
import { FormControl } from '@angular/forms';
import { AuthUtilsService } from '@common/utils/auth.utils';

export const fedGroupDetailsTabs = [
  'member',
  'process profile rules',
  'file access rules',
  'network rules',
  'response rules',
  'DLP',
  'WAF',
];

@Component({
  standalone: false,
  selector: 'app-fed-group-details',
  templateUrl: './fed-group-details.component.html',
  styleUrls: ['./fed-group-details.component.scss'],
})
export class FedGroupDetailsComponent implements OnInit, AfterViewInit {
  @Input() kind: string;
  @Input() groupName: string;
  @Input() members: any;
  @Input() height: number;
  public CFG_TYPE: any = GlobalConstant.CFG_TYPE;
  public navSource4Group: string = '';
  public groupScope: string = '';
  public showPredefinedRules: any;
  public enabled: boolean;
  public editGroupSensorModal: any;
  public toggleWAFConfigEnablement: any;
  public toggleDLPConfigEnablement: any;
  public removeProfile: any;
  public editProfile: any;
  public addProfile: any;
  public selectedFileAccessRules: any;
  public selectedProcessProfileRules: any;
  public isWriteWafAuthorized: boolean;
  public isWriteDlpAuthorized: boolean;
  public isWriteGroupAuthorized: boolean;
  public isWriteFileAccessRuleAuthorized: boolean;
  public isWriteProcessProfileRuleAuthorized: boolean;
  public filter = new FormControl('');
  get activeTab(): string {
    return fedGroupDetailsTabs[
      this.federatedConfigurationService.activeTabIndex4Group
    ];
  }

  constructor(
    public federatedConfigurationService: FederatedConfigurationService,
    private authUtilsService: AuthUtilsService
  ) {}

  ngOnInit(): void {
    this.isWriteGroupAuthorized =
      this.authUtilsService.getDisplayFlag('write_group') &&
      this.authUtilsService.getDisplayFlag('multi_cluster_w');
    this.isWriteWafAuthorized =
      this.authUtilsService.getDisplayFlag('write_waf_rule') &&
      this.authUtilsService.getDisplayFlag('multi_cluster_w');
    this.isWriteDlpAuthorized =
      this.authUtilsService.getDisplayFlag('write_dlp_rule') &&
      this.authUtilsService.getDisplayFlag('multi_cluster_w');
    this.navSource4Group = GlobalConstant.NAV_SOURCE.FED_POLICY;
    this.groupScope = GlobalConstant.NAV_SOURCE.FED_GROUP;
  }

  ngAfterViewInit() {
    const TAB_VISIBLE_MATRIX = [
      true,
      this.kind === 'container' || this.kind === 'node',
      this.kind === 'container',
      true,
      true,
      this.kind === 'container',
      this.kind === 'container',
    ];
    if (
      !TAB_VISIBLE_MATRIX[
        this.federatedConfigurationService.activeTabIndex4Group
      ]
    )
      this.federatedConfigurationService.activeTabIndex4Group = 0;
  }

  private setHeight = (innerHeight: number) => {
    return (innerHeight - 210) / 2;
  };

  getStatus = enabled => {
    this.enabled = enabled;
  };

  activateTab4Group = event => {
    this.federatedConfigurationService.activeTabIndex4Group = event.index;
  };

  getEditGroupSensorModal = editGroupSensorModal => {
    this.editGroupSensorModal = editGroupSensorModal;
  };

  getToggleWAFConfigEnablement = toggleWAFConfigEnablement => {
    this.toggleWAFConfigEnablement = toggleWAFConfigEnablement;
  };

  getToggleDLPConfigEnablement = toggleDLPConfigEnablement => {
    this.toggleDLPConfigEnablement = toggleDLPConfigEnablement;
  };

  getSelectedFileAccessRules = selectedFileAccessRules => {
    this.selectedFileAccessRules = selectedFileAccessRules;
  };

  getSelectedProcessProfileRules = selectedProcessProfileRules => {
    this.selectedProcessProfileRules = selectedProcessProfileRules;
  };

  getRemoveProfile = removeProfile => {
    this.removeProfile = removeProfile;
  };

  getEditProfile = editProfile => {
    this.editProfile = editProfile;
  };

  getAddProfile = addProfile => {
    this.addProfile = addProfile;
  };

  getShowPredefinedRules = showPredefinedRules => {
    this.showPredefinedRules = showPredefinedRules;
  };

  isIncludingGroundRule = () => {
    let index = this.selectedProcessProfileRules.findIndex(
      rule => rule.cfg_type === GlobalConstant.CFG_TYPE.GROUND
    );
    return index > -1;
  };
}
