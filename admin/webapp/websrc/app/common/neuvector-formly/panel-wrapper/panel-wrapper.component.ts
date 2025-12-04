import { Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  standalone: false,
  selector: 'app-panel-wrapper',
  templateUrl: './panel-wrapper.component.html',
  styleUrls: ['./panel-wrapper.component.scss'],
  
})
export class PanelWrapperComponent extends FieldWrapper {
  panelOpenState = false;
}
