import { Component, OnInit, Input } from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';
import * as moment from 'moment';

@Component({
  standalone: false,
  selector: 'app-enforcer-brief',
  templateUrl: './enforcer-brief.component.html',
  styleUrls: ['./enforcer-brief.component.scss'],
})
export class EnforcerBriefComponent implements OnInit {
  @Input() enforcer!: any;
  upTime!: string;

  constructor(private utils: UtilsService) {}

  ngOnInit(): void {
    console.log('this.enforcer', this.enforcer);
    this.upTime = this.utils.humanizeDuration(
      moment.duration(moment().diff(this.enforcer.joined_at))
    );
  }
}
