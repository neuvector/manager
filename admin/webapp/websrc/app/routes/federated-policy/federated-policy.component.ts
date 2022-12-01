import { Component, OnInit, HostListener } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';

@Component({
  selector: 'app-federated-policy',
  templateUrl: './federated-policy.component.html',
  styleUrls: ['./federated-policy.component.scss'],
})
export class FederatedPolicyComponent implements OnInit {
  public activeTabIndex: number = 0;
  public navSource: string = '';
  public CFG_TYPE: any = GlobalConstant.CFG_TYPE;
  public height: number = 0;
  private readonly win: any;
  constructor() {
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

  activateTab(event) {
    this.activeTabIndex = event.index;
  }

  private setHeight = (innerHeight: number) => {
    return innerHeight - 210;
  };

}
