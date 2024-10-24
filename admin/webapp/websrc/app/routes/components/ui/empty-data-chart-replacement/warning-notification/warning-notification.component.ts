import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-warning-notification',
  templateUrl: './warning-notification.component.html',
  styleUrls: ['./warning-notification.component.scss'],
})
export class WarningNotificationComponent {
  @Input() message: string;

  constructor() {}
}
