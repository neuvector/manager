import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { GroupsComponent } from '@components/groups/groups.component';
import { FederatedConfigurationService } from '@services/federated-configuration.service';
import { FormControl } from '@angular/forms';

export const fedGroupDetailsTabs = [
  'process profile rules',
  'file access rules',
  'DLP',
  'WAF',
];

@Component({
  standalone: false,
  selector: 'app-federated-policy',
  templateUrl: './federated-policy.component.html',
  styleUrls: ['./federated-policy.component.scss'],
})
export class FederatedPolicyComponent implements OnInit {
  public activeTabIndex: number = 0;
  public navSource: string = '';
  public height: number = 0;
  public CFG_TYPE: any = GlobalConstant.CFG_TYPE;
  private readonly win: any;
  get activeTab(): string {
    return fedGroupDetailsTabs[
      this.federatedConfigurationService.activeTabIndex4Group
    ];
  }
  @ViewChild(GroupsComponent) groupsView!: GroupsComponent;

  constructor(
    public federatedConfigurationService: FederatedConfigurationService
  ) {
    this.win = GlobalVariable.window;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.height = this.setHeight(event.target.innerHeight);
  }

  ngOnInit(): void {
    this.activeTabIndex = 0;
    this.height = this.setHeight(this.win.innerHeight);
    this.navSource = GlobalConstant.NAV_SOURCE.FED_POLICY;
  }

  activateTab = event => {
    this.activeTabIndex = event.index;
  };

  private setHeight = (innerHeight: number) => {
    return (innerHeight - 210) / 2;
  };
}
