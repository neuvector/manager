import { Component, OnInit, Input } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
})
export class GroupDetailsComponent implements OnInit {
  @Input() resizableHeight!: number;
  @Input() selectedGroupName!: string;
  @Input() members: any;
  @Input() kind!: string;
  @Input() isScoreImprovement: boolean = false;
  public activeTabIndex: number = 0;
  public navSource!: string;

  constructor() {}

  ngOnInit(): void {
    this.navSource = GlobalConstant.NAV_SOURCE.GROUP;
  }

  activateTab = event => {
    this.activeTabIndex = event.index;
  };

  getServiceName = (name: string) => {
    return name.startsWith('nv.') ? name.slice(3) : name;
  };
}
