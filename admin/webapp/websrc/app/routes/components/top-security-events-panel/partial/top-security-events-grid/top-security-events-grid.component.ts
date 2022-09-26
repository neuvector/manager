import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-top-security-events-grid',
  templateUrl: './top-security-events-grid.component.html',
  styleUrls: ['./top-security-events-grid.component.scss']
})
export class TopSecurityEventsGridComponent implements OnInit {

  @Input() topSecurityEvents: any;
  @Input() direction: string;

  constructor() { }

  ngOnInit(): void {
  }

}
