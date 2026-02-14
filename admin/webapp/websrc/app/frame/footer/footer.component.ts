import { Component, OnInit } from '@angular/core';
import { SwitchersService } from '../../core/switchers/switchers.service';
import { GlobalVariable } from '@common/variables/global.variable';

@Component({
  standalone: false,
  selector: '[app-footer]',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  version: string = '';
  constructor(public switchers: SwitchersService) {}
  ngOnInit() {
    setInterval(() => {
      if (GlobalVariable.versionDone)
        this.version = GlobalVariable.version || '';
    }, 500);
  }
}
