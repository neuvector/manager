import { Component, Input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-safe-notification',
  templateUrl: './safe-notification.component.html',
  styleUrls: ['./safe-notification.component.scss'],
})
export class SafeNotificationComponent {
  @Input() message: string;

  constructor() {}
}
