import { Component } from '@angular/core';
import { SwitchersService } from '../../core/switchers/switchers.service';

@Component({
  selector: '[app-footer]',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  constructor(public switchers: SwitchersService) {}
}
