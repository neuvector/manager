import {
  Component,
  OnInit,
  Input
} from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GroupsService } from '@common/services/groups.service';

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
  @Input() cfgType: string = '';
  public navSource!: string;
  CFG_TYPE = GlobalConstant.CFG_TYPE;

  constructor(
    public groupsService: GroupsService
  ) {}

  ngOnInit(): void {
    this.navSource = GlobalConstant.NAV_SOURCE.GROUP;
  }

  ngAfterViewInit() {
    const TAB_VISIBLE_MATRIX = [
      true,
      (this.kind==='container' || this.kind==='node') && this.cfgType !== GlobalConstant.CFG_TYPE.FED,
      this.kind==='container' || this.kind==='node',
      this.kind==='container',
      true,
      true,
      this.kind==='container' && this.cfgType !== GlobalConstant.CFG_TYPE.FED,
      this.kind==='container' && this.cfgType !== GlobalConstant.CFG_TYPE.FED
    ];
    if (!TAB_VISIBLE_MATRIX[this.groupsService.activeTabIndex]) this.groupsService.activeTabIndex = 0;
  }

  activateTab = event => {
    this.groupsService.activeTabIndex = event.index;
  };

  getServiceName = (name: string) => {
    return name.startsWith('nv.') ? name.slice(3) : name;
  };
}
