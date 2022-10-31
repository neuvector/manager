import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-warning-notification',
  templateUrl: './warning-notification.component.html',
  styleUrls: ['./warning-notification.component.scss']
})
export class WarningNotificationComponent implements OnInit {

  @Input() message: string;
  
  constructor() { }

  ngOnInit(): void {
  }

}
