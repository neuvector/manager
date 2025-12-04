import { Component, OnInit } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';

@Component({
  standalone: false,
  selector: 'app-layout',
  templateUrl: './frame.component.html',
  styleUrls: ['./frame.component.scss'],
  
})
export class FrameComponent implements OnInit {
  customStyle;

  constructor() {}

  ngOnInit() {
    // the customized banner height is 28px
    // the default header banner height is 72px
    if (GlobalVariable.customPageHeaderColor) {
      this.customStyle = {
        'margin-top': '100px',
      };
    }
  }
}
