import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GroupsService } from '@common/services/groups.service';
import { FormControl } from '@angular/forms';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { tap } from 'rxjs/operators';
import { AuthUtilsService } from '@common/utils/auth.utils';


export const groupDetailsTabs = [
  'member',
  'custom check',
  'process profile rules',
  'file access rules',
  'network rules',
  'response rules',
  'DLP',
  'WAF',
];

@Component({
  standalone: false,
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  
})
export class GroupDetailsComponent implements OnInit, AfterViewInit {
  @Input() resizableHeight!: number;
  @Input() selectedGroupName!: string;
  @Input() members: any;
  @Input() kind!: string;
  @Input() isScoreImprovement: boolean = false;
  @Input() cfgType: string = '';
  @Input() baselineProfile: string = '';
  editGroupSensorModal: any;
  toggleWAFConfigEnablement: any;
  toggleDLPConfigEnablement: any;
  enabled: boolean;
  selectedFileAccessRules: any;
  selectedProcessProfileRules: any;
  removeProfile: any;
  editProfile: any;
  addProfile: any;
  showPredefinedRules: any;
  isWriteWafAuthorized: boolean;
  isWriteDlpAuthorized: boolean;
  isWriteGroupAuthorized: boolean;
  isWriteFileAccessRuleAuthorized: boolean;
  isWriteProcessProfileRuleAuthorized: boolean;
  CFG_TYPE = GlobalConstant.CFG_TYPE;
  get activeTab(): string {
    return groupDetailsTabs[this.groupsService.activeTabIndex];
  }
  public navSource!: string;
  filter = new FormControl('');

  constructor(
    public groupsService: GroupsService,
    private quickFilterService: QuickFilterService,
    private authUtilsService: AuthUtilsService
  ) {}

  ngOnInit(): void {
    this.isWriteWafAuthorized =
      this.authUtilsService.getDisplayFlag('write_waf_rule');
    this.isWriteDlpAuthorized =
      this.authUtilsService.getDisplayFlag('write_dlp_rule');
    this.isWriteGroupAuthorized =
      this.authUtilsService.getDisplayFlag('write_group');
    this.isWriteFileAccessRuleAuthorized =
      this.cfgType === GlobalConstant.CFG_TYPE.CUSTOMER ||
      this.cfgType === GlobalConstant.CFG_TYPE.LEARNED;
    this.isWriteProcessProfileRuleAuthorized =
      this.isWriteFileAccessRuleAuthorized ||
      this.cfgType === GlobalConstant.CFG_TYPE.GROUND;
    this.navSource = GlobalConstant.NAV_SOURCE.GROUP;
    this.filter.valueChanges
      .pipe(
        tap((value: string | null) =>
          this.quickFilterService.setTextInput(value || '')
        )
      )
      .subscribe();
  }

  ngAfterViewInit() {
    const TAB_VISIBLE_MATRIX = [
      true,
      (this.kind === 'container' || this.kind === 'node') &&
        this.cfgType !== GlobalConstant.CFG_TYPE.FED,
      this.kind === 'container' || this.kind === 'node',
      this.kind === 'container',
      true,
      true,
      this.kind === 'container' && this.cfgType !== GlobalConstant.CFG_TYPE.FED,
      this.kind === 'container' && this.cfgType !== GlobalConstant.CFG_TYPE.FED,
    ];
    if (!TAB_VISIBLE_MATRIX[this.groupsService.activeTabIndex])
      this.groupsService.activeTabIndex = 0;
  }

  isIncludingGroundRule = () => {
    let index = this.selectedProcessProfileRules.findIndex(
      rule => rule.cfg_type === GlobalConstant.CFG_TYPE.GROUND
    );
    return index > -1;
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

  getStatus = enabled => {
    this.enabled = enabled;
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

  activateTab = event => {
    this.groupsService.activeTabIndex = event.index;
  };

  getServiceName = (name: string) => {
    return name.startsWith('nv.') ? name.slice(3) : name;
  };
}
