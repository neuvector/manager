import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-safe-notification',
  templateUrl: './safe-notification.component.html',
  styleUrls: ['./safe-notification.component.scss']
})
export class SafeNotificationComponent implements OnInit {

  @Input() message: string;

  constructor() { }

  ngOnInit(): void {
  }

}
