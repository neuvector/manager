import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  columns!: number;

  breakPoints(): void {
    switch (true) {
      case window.innerWidth <= 640:
        this.columns = 1;
        break;
      case window.innerWidth > 640 && window.innerWidth <= 1024:
        this.columns = 2;
        break;
      default:
        this.columns = 3;
    }
  }

  ngOnInit(): void {
    this.breakPoints();
  }

  onResize(): void {
    this.breakPoints();
  }
}
