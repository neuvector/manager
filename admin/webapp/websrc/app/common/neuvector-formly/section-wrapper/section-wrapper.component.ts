import { Component, OnInit } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  standalone: false,
  selector: 'app-section-wrapper',
  templateUrl: './section-wrapper.component.html',
  styleUrls: ['./section-wrapper.component.scss'],
  
})
export class SectionWrapperComponent extends FieldWrapper {
  Array = Array;
}
