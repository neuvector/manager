import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';

@Component({
  standalone: false,
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  
})
export class SliderComponent extends FieldType<FieldTypeConfig> {
  interval;

  changeValue(event): void {
    this.interval = event.value;
  }
}
