import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';


@Component({
  standalone: false,
  selector: 'app-text-area',
  templateUrl: './text-area.component.html',
  styleUrls: ['./text-area.component.scss'],
  
})
export class TextAreaComponent extends FieldType<FieldTypeConfig> {}
