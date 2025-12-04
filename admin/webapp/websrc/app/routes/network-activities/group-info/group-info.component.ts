import { Component, Input, OnInit } from '@angular/core';
import {
  ActivityState,
  PopupState,
} from '@common/types/network-activities/activityState';
import { Group } from '@common/types';
import { GlobalConstant } from '@common/constants/global.constant';


@Component({
  standalone: false,
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss'],
  
})
export class GroupInfoComponent implements OnInit {
  private _group!: Group;
  private _popupState: ActivityState;

  activeTabIndex: number = 0;
  navSource: string = '';
  height: number = 420;

  get popupState(): ActivityState {
    return this._popupState;
  }

  @Input()
  set popupState(value: ActivityState) {
    this._popupState = value;
  }
  get group(): Group {
    return this._group;
  }

  @Input()
  set group(value: Group) {
    this._group = value;
  }

  constructor() {
    this._popupState = new ActivityState(PopupState.onInit);
  }

  ngOnInit(): void {
    this.navSource = GlobalConstant.NAV_SOURCE.GROUP;
  }

  activateTab = event => {
    this.activeTabIndex = event.index;
  };
}
