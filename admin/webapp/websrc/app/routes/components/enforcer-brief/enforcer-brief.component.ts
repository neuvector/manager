import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-enforcer-brief',
  templateUrl: './enforcer-brief.component.html',
  styleUrls: ['./enforcer-brief.component.scss']
})
export class EnforcerBriefComponent implements OnInit {

  @Input() enforcer!: any;
  upTime: string;

  constructor() { }

  ngOnInit(): void {
    console.log('this.enforcer', this.enforcer);
    this.upTime = moment.duration(moment().diff(this.enforcer.joined_at)).humanize();
  }

}
